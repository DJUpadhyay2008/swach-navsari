-- ==============================================================================
-- S.W.A.C.H. Navsari — Migration 01: Core Schema & Enums
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Custom Enums & Types
-- ------------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM (
    'citizen',
    'municipal_official',
    'sanitation_worker'
);

CREATE TYPE public.complaint_category AS ENUM (
    'garbage_dump',
    'overflowing_bin',
    'dead_animal',
    'sewage_overflow',
    'construction_debris',
    'open_defecation',
    'drainage_blockage',
    'hazardous_waste',
    'other'
);

CREATE TYPE public.complaint_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE public.complaint_status AS ENUM (
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'resolution_submitted',
    'resolved',
    'rejected',
    'reopened',
    'cancelled'
);

CREATE TYPE public.assignment_status AS ENUM (
    'assigned',
    'accepted',
    'in_progress',
    'completed',
    'reassigned',
    'cancelled'
);

CREATE TYPE public.event_status AS ENUM (
    'upcoming',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE public.participant_status AS ENUM (
    'registered',
    'attended',
    'cancelled'
);

-- Sequence for safe human-readable complaint IDs (NAV-YYYY-XXXXX)
CREATE SEQUENCE IF NOT EXISTS public.complaint_id_seq START 1;

-- ------------------------------------------------------------------------------
-- 2. User Roles (Protected Separate Table - Never client-writable)
-- ------------------------------------------------------------------------------

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'citizen',
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ------------------------------------------------------------------------------
-- 3. Profiles (Public application metadata linked to auth.users)
-- ------------------------------------------------------------------------------

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
    phone_number TEXT CHECK (phone_number IS NULL OR phone_number ~ '^\+?[0-9]{10,14}$'),
    ward_number INTEGER CHECK (ward_number IS NULL OR (ward_number >= 1 AND ward_number <= 20)),
    locality TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_profiles_ward_number ON public.profiles(ward_number);

-- ------------------------------------------------------------------------------
-- 4. Reports (Main complaint records)
-- ------------------------------------------------------------------------------

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id TEXT NOT NULL UNIQUE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    category public.complaint_category NOT NULL,
    priority public.complaint_priority NOT NULL DEFAULT 'medium',
    status public.complaint_status NOT NULL DEFAULT 'submitted',
    description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    address_locality TEXT NOT NULL CHECK (char_length(trim(address_locality)) >= 3),
    landmark TEXT,
    ward_number INTEGER NOT NULL CHECK (ward_number >= 1 AND ward_number <= 20),
    rejection_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ,
    reopened_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_category ON public.reports(category);
CREATE INDEX idx_reports_ward_number ON public.reports(ward_number);
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_submitted_at ON public.reports(submitted_at DESC);
CREATE INDEX idx_reports_location ON public.reports(latitude, longitude);

-- Function & Trigger to automatically generate safe complaint ID (e.g. NAV-2026-00001)
CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TRIGGER AS $$
DECLARE
    current_yr TEXT;
    seq_val BIGINT;
BEGIN
    current_yr := to_char(CURRENT_DATE, 'YYYY');
    seq_val := nextval('public.complaint_id_seq');
    NEW.complaint_id := 'NAV-' || current_yr || '-' || lpad(seq_val::text, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_complaint_id
BEFORE INSERT ON public.reports
FOR EACH ROW
WHEN (NEW.complaint_id IS NULL OR NEW.complaint_id = '')
EXECUTE FUNCTION public.generate_complaint_id();

-- ------------------------------------------------------------------------------
-- 5. Report Media (Initial citizen-submitted photo evidence metadata)
-- ------------------------------------------------------------------------------

CREATE TABLE public.report_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760), -- max 10MB
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    media_type TEXT NOT NULL DEFAULT 'initial_evidence' CHECK (media_type IN ('initial_evidence', 'reopen_evidence')),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_report_media_report_id ON public.report_media(report_id);
CREATE INDEX idx_report_media_uploaded_by ON public.report_media(uploaded_by);

-- ------------------------------------------------------------------------------
-- 6. Assignments (Sanitation worker tasks dispatched by municipal officials)
-- ------------------------------------------------------------------------------

CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE RESTRICT,
    worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status public.assignment_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_assignments_report_id ON public.assignments(report_id);
CREATE INDEX idx_assignments_worker_id ON public.assignments(worker_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);

-- ------------------------------------------------------------------------------
-- 7. Report Status History (Immutable lifecycle audit log)
-- ------------------------------------------------------------------------------

CREATE TABLE public.report_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE RESTRICT,
    previous_status public.complaint_status,
    new_status public.complaint_status NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_report_status_history_report_id ON public.report_status_history(report_id);
CREATE INDEX idx_report_status_history_created_at ON public.report_status_history(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. Resolution Evidence (Photos & notes submitted by sanitation workers)
-- ------------------------------------------------------------------------------

CREATE TABLE public.resolution_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE RESTRICT,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE RESTRICT,
    worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    notes TEXT NOT NULL CHECK (char_length(trim(notes)) >= 5),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_resolution_evidence_report_id ON public.resolution_evidence(report_id);
CREATE INDEX idx_resolution_evidence_worker_id ON public.resolution_evidence(worker_id);

-- ------------------------------------------------------------------------------
-- 9. Report Feedback (Citizen satisfaction and reopen request)
-- ------------------------------------------------------------------------------

CREATE TABLE public.report_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE RESTRICT,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    is_satisfied BOOLEAN NOT NULL DEFAULT true,
    needs_reopening BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_report_feedback_report_id ON public.report_feedback(report_id);
CREATE INDEX idx_report_feedback_citizen_id ON public.report_feedback(citizen_id);

-- ------------------------------------------------------------------------------
-- 10. Cleanup Events (Community civic drives in Navsari)
-- ------------------------------------------------------------------------------

CREATE TABLE public.cleanup_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) >= 5),
    description TEXT NOT NULL CHECK (char_length(trim(description)) >= 20),
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    ward_number INTEGER NOT NULL CHECK (ward_number >= 1 AND ward_number <= 20),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status public.event_status NOT NULL DEFAULT 'upcoming',
    max_volunteers INTEGER CHECK (max_volunteers IS NULL OR max_volunteers > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_event_time_window CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX idx_cleanup_events_scheduled_start ON public.cleanup_events(scheduled_start);
CREATE INDEX idx_cleanup_events_ward_number ON public.cleanup_events(ward_number);
CREATE INDEX idx_cleanup_events_status ON public.cleanup_events(status);

-- ------------------------------------------------------------------------------
-- 11. Event Participants (Volunteer signups and attendance)
-- ------------------------------------------------------------------------------

CREATE TABLE public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.cleanup_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status public.participant_status NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    attended_at TIMESTAMPTZ,
    CONSTRAINT uq_event_participant UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);

-- ------------------------------------------------------------------------------
-- 12. Audit Logs (Administrative & Security-sensitive changes)
-- ------------------------------------------------------------------------------

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 13. Automatic Profile & Default Citizen Role on User Signup
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create public profile with safe fallbacks
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Citizen of Navsari'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Automatically assign default 'citizen' role in protected user_roles table
    -- elevated roles (municipal_official, sanitation_worker) can NEVER be self-assigned!
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'citizen')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto-updating updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cleanup_events_updated_at BEFORE UPDATE ON public.cleanup_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ==============================================================================
-- S.W.A.C.H. Navsari — Migration 02: Complaint Lifecycle & Trusted Functions
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Security Definer Role Verification Helpers
-- (Avoid recursive RLS policies by using SECURITY DEFINER functions)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_roles()
RETURNS public.app_role[] AS $$
DECLARE
    roles public.app_role[];
BEGIN
    SELECT array_agg(role)
    INTO roles
    FROM public.user_roles
    WHERE user_id = auth.uid();

    RETURN COALESCE(roles, ARRAY['citizen'::public.app_role]);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_assigned_worker(_report_id UUID, _worker_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.assignments
        WHERE report_id = _report_id
          AND worker_id = _worker_id
          AND status IN ('assigned', 'accepted', 'in_progress')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 2. Trusted Report Status Transition Function
-- Enforces the complaint lifecycle state machine on the database level.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.transition_report_status(
    p_report_id UUID,
    p_new_status public.complaint_status,
    p_note TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS public.reports AS $$
DECLARE
    v_report public.reports%ROWTYPE;
    v_actor_id UUID;
    v_is_official BOOLEAN;
    v_is_assigned BOOLEAN;
    v_is_reporter BOOLEAN;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to perform status transition.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Lock the target report row for update to prevent race conditions
    SELECT * INTO v_report
    FROM public.reports
    WHERE id = p_report_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report with ID % not found.', p_report_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Evaluate caller authority
    v_is_official := public.has_role(v_actor_id, 'municipal_official');
    v_is_assigned := public.is_assigned_worker(v_report.id, v_actor_id);
    v_is_reporter := (v_report.reporter_id = v_actor_id);

    -- State Machine Validation
    IF v_report.status = p_new_status THEN
        -- No transition needed
        RETURN v_report;
    END IF;

    CASE v_report.status
        WHEN 'submitted' THEN
            IF p_new_status IN ('under_review', 'assigned') THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can move a report to under_review or assigned.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'rejected' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can reject a report.'
                        USING ERRCODE = '42501';
                END IF;
                IF p_rejection_reason IS NULL OR char_length(trim(p_rejection_reason)) < 5 THEN
                    RAISE EXCEPTION 'A valid rejection reason (min 5 chars) is mandatory when rejecting a report.'
                        USING ERRCODE = 'P0003';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT (v_is_reporter OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the reporter or a municipal official can cancel this report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from submitted to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'under_review' THEN
            IF p_new_status = 'assigned' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can assign reports.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'rejected' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can reject a report.'
                        USING ERRCODE = '42501';
                END IF;
                IF p_rejection_reason IS NULL OR char_length(trim(p_rejection_reason)) < 5 THEN
                    RAISE EXCEPTION 'A valid rejection reason (min 5 chars) is mandatory when rejecting a report.'
                        USING ERRCODE = 'P0003';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT (v_is_reporter OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the reporter or a municipal official can cancel this report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from under_review to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'assigned' THEN
            IF p_new_status = 'in_progress' THEN
                IF NOT (v_is_assigned OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the assigned sanitation worker or an official can mark work in_progress.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can cancel an assigned report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from assigned to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'in_progress' THEN
            IF p_new_status = 'resolution_submitted' THEN
                IF NOT (v_is_assigned OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the assigned sanitation worker or an official can submit resolution.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can cancel an in-progress report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from in_progress to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'resolution_submitted' THEN
            IF p_new_status = 'resolved' THEN
                IF NOT (v_is_official OR v_is_reporter) THEN
                    RAISE EXCEPTION 'Only an official or the reporting citizen can verify and resolve the complaint.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'in_progress' THEN
                -- Disputed or inadequate evidence, sent back to worker
                IF NOT (v_is_official OR v_is_reporter) THEN
                    RAISE EXCEPTION 'Only an official or the reporting citizen can request rework.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from resolution_submitted to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'resolved' THEN
            IF p_new_status = 'reopened' THEN
                IF NOT (v_is_reporter OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the reporter or a municipal official can reopen a resolved report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from resolved to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'reopened' THEN
            IF p_new_status IN ('under_review', 'assigned') THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can triage reopened reports.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from reopened to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'rejected', 'cancelled' THEN
            -- Terminal states; can only be reopened by municipal official with note
            IF NOT v_is_official THEN
                RAISE EXCEPTION 'Cannot modify a terminal report status (%).' , v_report.status
                    USING ERRCODE = '42501';
            END IF;
    END CASE;

    -- Update report record
    UPDATE public.reports
    SET status = p_new_status,
        rejection_reason = CASE
            WHEN p_new_status = 'rejected' THEN p_rejection_reason
            ELSE rejection_reason
        END,
        resolved_at = CASE
            WHEN p_new_status = 'resolved' THEN timezone('utc'::text, now())
            ELSE resolved_at
        END,
        reopened_at = CASE
            WHEN p_new_status = 'reopened' THEN timezone('utc'::text, now())
            ELSE reopened_at
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_report_id
    RETURNING * INTO v_report;

    -- Append audit entry to immutable report_status_history
    INSERT INTO public.report_status_history (
        report_id,
        previous_status,
        new_status,
        actor_id,
        note
    ) VALUES (
        p_report_id,
        v_report.status,
        p_new_status,
        v_actor_id,
        p_note
    );

    RETURN v_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 3. Trusted Report Assignment Transaction
-- Atomically assigns a report to a worker, changes status, and records history.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_report(
    p_report_id UUID,
    p_worker_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.assignments AS $$
DECLARE
    v_assignment public.assignments%ROWTYPE;
    v_official_id UUID;
    v_is_worker BOOLEAN;
BEGIN
    v_official_id := auth.uid();
    IF v_official_id IS NULL OR NOT public.has_role(v_official_id, 'municipal_official') THEN
        RAISE EXCEPTION 'Only authenticated municipal officials can assign reports to workers.'
            USING ERRCODE = '42501';
    END IF;

    -- Verify target user has sanitation_worker role
    v_is_worker := public.has_role(p_worker_id, 'sanitation_worker');
    IF NOT v_is_worker THEN
        RAISE EXCEPTION 'Target user (%) is not registered as a sanitation worker.' , p_worker_id
            USING ERRCODE = 'P0004';
    END IF;

    -- Deactivate any previously active assignments for this report
    UPDATE public.assignments
    SET status = 'reassigned',
        updated_at = timezone('utc'::text, now())
    WHERE report_id = p_report_id
      AND status IN ('assigned', 'accepted', 'in_progress');

    -- Insert new active assignment
    INSERT INTO public.assignments (
        report_id,
        worker_id,
        assigned_by,
        status,
        notes
    ) VALUES (
        p_report_id,
        p_worker_id,
        v_official_id,
        'assigned',
        p_notes
    )
    RETURNING * INTO v_assignment;

    -- Transition report status to 'assigned'
    PERFORM public.transition_report_status(
        p_report_id,
        'assigned',
        'Assigned to sanitation worker: ' || p_worker_id::text
    );

    RETURN v_assignment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 4. Overdue SLA Calculation View
-- Helps municipal officials identify stalled or overdue cleanliness reports.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.vw_overdue_reports AS
SELECT
    r.id,
    r.complaint_id,
    r.category,
    r.priority,
    r.status,
    r.ward_number,
    r.address_locality,
    r.submitted_at,
    CASE r.priority
        WHEN 'urgent' THEN INTERVAL '24 hours'
        WHEN 'high'   THEN INTERVAL '48 hours'
        WHEN 'medium' THEN INTERVAL '72 hours'
        ELSE INTERVAL '120 hours'
    END AS sla_target_interval,
    (timezone('utc'::text, now()) - r.submitted_at) AS age_interval,
    CASE
        WHEN r.status IN ('resolved', 'rejected', 'cancelled') THEN false
        WHEN (timezone('utc'::text, now()) - r.submitted_at) >
             CASE r.priority
                 WHEN 'urgent' THEN INTERVAL '24 hours'
                 WHEN 'high'   THEN INTERVAL '48 hours'
                 WHEN 'medium' THEN INTERVAL '72 hours'
                 ELSE INTERVAL '120 hours'
             END THEN true
        ELSE false
    END AS is_overdue
FROM public.reports r;
-- ==============================================================================
-- S.W.A.C.H. Navsari — Migration 03: Row Level Security (RLS) Policies
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ------------------------------------------------------------------------------

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. user_roles Policies
-- ------------------------------------------------------------------------------

-- Users can see their own role; officials can see all roles
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'municipal_official')
);

-- Only municipal officials can grant or revoke roles (elevated permissions protection)
CREATE POLICY "user_roles_modify_policy"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'municipal_official'))
WITH CHECK (public.has_role(auth.uid(), 'municipal_official'));

-- ------------------------------------------------------------------------------
-- 3. profiles Policies
-- ------------------------------------------------------------------------------

-- Authenticated users can view profiles of officials and workers
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. reports Policies
-- ------------------------------------------------------------------------------

-- SELECT:
-- 1. Officials can view all reports
-- 2. Workers can view reports currently assigned to them
-- 3. Citizens can view their own filed reports
CREATE POLICY "reports_select_policy"
ON public.reports
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR (
        public.has_role(auth.uid(), 'sanitation_worker')
        AND public.is_assigned_worker(id, auth.uid())
    )
    OR reporter_id = auth.uid()
);

-- INSERT:
-- Authenticated citizens can submit new reports
CREATE POLICY "reports_insert_policy"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
    reporter_id = auth.uid()
    AND status = 'submitted'
);

-- UPDATE:
-- 1. Officials have administrative authority to update
-- 2. Citizens can update their own reports only while in 'submitted' status (e.g. edit description)
CREATE POLICY "reports_update_policy"
ON public.reports
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR (reporter_id = auth.uid() AND status = 'submitted')
)
WITH CHECK (
    public.has_role(auth.uid(), 'municipal_official')
    OR (reporter_id = auth.uid() AND status = 'submitted')
);

-- DELETE:
-- Reports are never hard-deleted by ordinary users to preserve civic history
CREATE POLICY "reports_delete_policy"
ON public.reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'municipal_official'));

-- ------------------------------------------------------------------------------
-- 5. report_media Policies
-- ------------------------------------------------------------------------------

-- SELECT: Only authorized stakeholders can access complaint media metadata
CREATE POLICY "report_media_select_policy"
ON public.report_media
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR uploaded_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.id = report_media.report_id
          AND (
              r.reporter_id = auth.uid()
              OR (public.has_role(auth.uid(), 'sanitation_worker') AND public.is_assigned_worker(r.id, auth.uid()))
          )
    )
);

-- INSERT: Reporter can upload evidence for their own report
CREATE POLICY "report_media_insert_policy"
ON public.report_media
FOR INSERT
TO authenticated
WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.id = report_media.report_id
          AND r.reporter_id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- 6. assignments Policies
-- ------------------------------------------------------------------------------

-- SELECT: Officials see all; workers see their assignments; reporters see assignments for their report
CREATE POLICY "assignments_select_policy"
ON public.assignments
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR worker_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.id = assignments.report_id
          AND r.reporter_id = auth.uid()
    )
);

-- INSERT: Only officials can dispatch workers
CREATE POLICY "assignments_insert_policy"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'municipal_official'));

-- UPDATE: Officials can modify; assigned workers can update assignment status (e.g. accepted, in_progress)
CREATE POLICY "assignments_update_policy"
ON public.assignments
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR worker_id = auth.uid()
)
WITH CHECK (
    public.has_role(auth.uid(), 'municipal_official')
    OR worker_id = auth.uid()
);

-- ------------------------------------------------------------------------------
-- 7. report_status_history Policies
-- ------------------------------------------------------------------------------

-- SELECT: Accessible to officials, assigned workers, and the complaint reporter
CREATE POLICY "report_status_history_select_policy"
ON public.report_status_history
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.id = report_status_history.report_id
          AND (
              r.reporter_id = auth.uid()
              OR (public.has_role(auth.uid(), 'sanitation_worker') AND public.is_assigned_worker(r.id, auth.uid()))
          )
    )
);

-- INSERT: Handled via trusted database functions; direct insert allowed only for the actor
CREATE POLICY "report_status_history_insert_policy"
ON public.report_status_history
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. resolution_evidence Policies
-- ------------------------------------------------------------------------------

-- SELECT: Officials, reporting citizens (to verify work), and the worker
CREATE POLICY "resolution_evidence_select_policy"
ON public.resolution_evidence
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR worker_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.id = resolution_evidence.report_id
          AND r.reporter_id = auth.uid()
    )
);

-- INSERT: Only assigned worker or municipal official can submit resolution evidence
CREATE POLICY "resolution_evidence_insert_policy"
ON public.resolution_evidence
FOR INSERT
TO authenticated
WITH CHECK (
    worker_id = auth.uid()
    AND (
        public.is_assigned_worker(report_id, auth.uid())
        OR public.has_role(auth.uid(), 'municipal_official')
    )
);

-- ------------------------------------------------------------------------------
-- 9. report_feedback Policies
-- ------------------------------------------------------------------------------

-- SELECT: Officials and the reporter can see feedback
CREATE POLICY "report_feedback_select_policy"
ON public.report_feedback
FOR SELECT
TO authenticated
USING (
    citizen_id = auth.uid()
    OR public.has_role(auth.uid(), 'municipal_official')
);

-- INSERT: Only the reporting citizen of a resolved report can submit feedback
CREATE POLICY "report_feedback_insert_policy"
ON public.report_feedback
FOR INSERT
TO authenticated
WITH CHECK (
    citizen_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.id = report_feedback.report_id
          AND r.reporter_id = auth.uid()
          AND r.status IN ('resolution_submitted', 'resolved')
    )
);

-- ------------------------------------------------------------------------------
-- 10. cleanup_events & event_participants Policies
-- ------------------------------------------------------------------------------

-- Cleanup events are visible to all authenticated citizens
CREATE POLICY "cleanup_events_select_policy"
ON public.cleanup_events
FOR SELECT
TO authenticated
USING (true);

-- Only officials and designated organizers can create/modify cleanup drives
CREATE POLICY "cleanup_events_modify_policy"
ON public.cleanup_events
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'municipal_official')
    OR organizer_id = auth.uid()
)
WITH CHECK (
    public.has_role(auth.uid(), 'municipal_official')
    OR organizer_id = auth.uid()
);

-- Event participants
CREATE POLICY "event_participants_select_policy"
ON public.event_participants
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'municipal_official')
    OR EXISTS (
        SELECT 1 FROM public.cleanup_events e
        WHERE e.id = event_participants.event_id AND e.organizer_id = auth.uid()
    )
);

CREATE POLICY "event_participants_insert_policy"
ON public.event_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_participants_update_policy"
ON public.event_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'municipal_official'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'municipal_official'));

-- ------------------------------------------------------------------------------
-- 11. audit_logs Policies
-- ------------------------------------------------------------------------------

-- Audit logs are strictly visible only to municipal officials
CREATE POLICY "audit_logs_select_policy"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'municipal_official'));

-- Inserts are allowed via system operations / authenticated actors
CREATE POLICY "audit_logs_insert_policy"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Modification or deletion of audit logs is strictly forbidden
-- (No UPDATE or DELETE policies created -> default deny)

-- ------------------------------------------------------------------------------
-- 12. Safe Public Complaint Tracking Function
-- Allows anonymous or external citizens to track complaint status by Complaint ID
-- without exposing internal user IDs, private coordinates, or restricted media.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.track_complaint(p_complaint_id TEXT)
RETURNS TABLE (
    complaint_id TEXT,
    category public.complaint_category,
    status public.complaint_status,
    priority public.complaint_priority,
    ward_number INTEGER,
    address_locality TEXT,
    submitted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    reopened_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.complaint_id,
        r.category,
        r.status,
        r.priority,
        r.ward_number,
        r.address_locality,
        r.submitted_at,
        r.resolved_at,
        r.reopened_at
    FROM public.reports r
    WHERE r.complaint_id = p_complaint_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
-- ==============================================================================
-- S.W.A.C.H. Navsari — Migration 04: Storage Buckets & Storage Security
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Private Buckets Definition
-- Neither bucket is public. Access requires authenticated session or signed URLs.
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'report-evidence',
        'report-evidence',
        false,
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'resolution-evidence',
        'resolution-evidence',
        false,
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. Storage RLS Policies for report-evidence Bucket
-- Path convention: report-evidence/{user_id}/{report_id}/{filename}
-- ------------------------------------------------------------------------------

-- Upload: Authenticated users can upload to their own user directory
CREATE POLICY "report_evidence_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'report-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read:
-- 1. Municipal officials have full inspection access
-- 2. Uploading citizen can read their own uploads
-- 3. Assigned workers can view evidence for reports assigned to them
CREATE POLICY "report_evidence_read_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'report-evidence'
    AND (
        public.has_role(auth.uid(), 'municipal_official')
        OR (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.reports r
            JOIN public.assignments a ON a.report_id = r.id
            WHERE (storage.foldername(name))[2] = r.id::text
              AND a.worker_id = auth.uid()
              AND a.status IN ('assigned', 'accepted', 'in_progress')
        )
    )
);

-- Delete: Only municipal officials can purge evidence objects
CREATE POLICY "report_evidence_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'report-evidence'
    AND public.has_role(auth.uid(), 'municipal_official')
);

-- ------------------------------------------------------------------------------
-- 3. Storage RLS Policies for resolution-evidence Bucket
-- Path convention: resolution-evidence/{worker_id}/{report_id}/{filename}
-- ------------------------------------------------------------------------------

-- Upload: Sanitation workers and officials can upload completion evidence
CREATE POLICY "resolution_evidence_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'resolution-evidence'
    AND (
        public.has_role(auth.uid(), 'municipal_official')
        OR (
            public.has_role(auth.uid(), 'sanitation_worker')
            AND (storage.foldername(name))[1] = auth.uid()::text
        )
    )
);

-- Read:
-- 1. Municipal officials
-- 2. Submitting worker
-- 3. Citizen who filed the original complaint (to inspect verified proof)
CREATE POLICY "resolution_evidence_read_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'resolution-evidence'
    AND (
        public.has_role(auth.uid(), 'municipal_official')
        OR (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.reports r
            WHERE (storage.foldername(name))[2] = r.id::text
              AND r.reporter_id = auth.uid()
        )
    )
);
-- ==============================================================================
-- S.W.A.C.H. Navsari — Migration 05: Phase 2 Citizen Reporting Enhancements
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Location Flexibility: Allow Manual Locality When Browser Geolocation Denied
-- ------------------------------------------------------------------------------

-- Make GPS coordinates and locality nullable individually, but require at least
-- one valid location identifier (coordinates OR manual locality of min 3 chars).
ALTER TABLE public.reports ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN address_locality DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN ward_number DROP NOT NULL;

-- Add location constraint ensuring either GPS coordinates or a descriptive locality is present
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS chk_report_location_provided;

ALTER TABLE public.reports
ADD CONSTRAINT chk_report_location_provided
CHECK (
    (latitude IS NOT NULL AND longitude IS NOT NULL)
    OR (address_locality IS NOT NULL AND char_length(trim(address_locality)) >= 3)
);

-- ------------------------------------------------------------------------------
-- 2. Automatic Status History on Initial Report Creation
-- Ensures every new report immediately logs an initial 'submitted' audit row.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_initial_report_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.report_status_history (
        report_id,
        previous_status,
        new_status,
        actor_id,
        note
    ) VALUES (
        NEW.id,
        NULL,
        NEW.status,
        NEW.reporter_id,
        'Initial complaint registration by citizen'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_record_initial_report_status ON public.reports;
CREATE TRIGGER trg_record_initial_report_status
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.record_initial_report_status();

-- ------------------------------------------------------------------------------
-- 3. Storage Cleanup Policy: Allow Uploader to Remove Orphaned Uploads
-- Enables client-side cleanup of evidence objects if submission aborts.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "report_evidence_owner_delete_policy" ON storage.objects;
CREATE POLICY "report_evidence_owner_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'report-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================================================
-- 06: Security Hardening & Lifecycle Integrity
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TRIGGER AS $$
DECLARE
    current_yr TEXT;
    seq_val BIGINT;
BEGIN
    current_yr := to_char(CURRENT_DATE, 'YYYY');
    seq_val := nextval('public.complaint_id_seq');
    NEW.complaint_id := 'NAV-' || current_yr || '-' || lpad(seq_val::text, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'reports' 
          AND column_name = 'tracking_token'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN tracking_token UUID DEFAULT gen_random_uuid() NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_tracking_token ON public.reports(tracking_token);

CREATE OR REPLACE FUNCTION public.is_assigned_worker(_report_id UUID, _worker_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.assignments
        WHERE report_id = _report_id
          AND worker_id = _worker_id
          AND status IN ('assigned', 'accepted', 'in_progress', 'completed')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "report_evidence_read_policy" ON storage.objects;
CREATE POLICY "report_evidence_read_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'report-evidence'
    AND (
        public.has_role(auth.uid(), 'municipal_official')
        OR (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.reports r
            JOIN public.assignments a ON a.report_id = r.id
            WHERE (storage.foldername(name))[2] = r.id::text
              AND a.worker_id = auth.uid()
              AND a.status IN ('assigned', 'accepted', 'in_progress', 'completed')
        )
    )
);

CREATE OR REPLACE FUNCTION public.transition_report_status(
    p_report_id UUID,
    p_new_status public.complaint_status,
    p_note TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS public.reports AS $$
DECLARE
    v_report public.reports%ROWTYPE;
    v_actor_id UUID;
    v_is_official BOOLEAN;
    v_is_assigned BOOLEAN;
    v_is_reporter BOOLEAN;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to perform status transition.'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_report
    FROM public.reports
    WHERE id = p_report_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report with ID % not found.', p_report_id
            USING ERRCODE = 'P0002';
    END IF;

    v_is_official := public.has_role(v_actor_id, 'municipal_official');
    v_is_assigned := public.is_assigned_worker(v_report.id, v_actor_id);
    v_is_reporter := (v_report.reporter_id = v_actor_id);

    IF v_report.status = p_new_status THEN
        RETURN v_report;
    END IF;

    CASE v_report.status
        WHEN 'submitted' THEN
            IF p_new_status IN ('under_review', 'assigned') THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can move a report to under_review or assigned.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'rejected' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can reject a report.'
                        USING ERRCODE = '42501';
                END IF;
                IF p_rejection_reason IS NULL OR char_length(trim(p_rejection_reason)) < 5 THEN
                    RAISE EXCEPTION 'A valid rejection reason (min 5 chars) is mandatory when rejecting a report.'
                        USING ERRCODE = 'P0003';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT (v_is_reporter OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the reporter or a municipal official can cancel this report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from submitted to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'under_review' THEN
            IF p_new_status = 'assigned' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can assign reports.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'rejected' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can reject a report.'
                        USING ERRCODE = '42501';
                END IF;
                IF p_rejection_reason IS NULL OR char_length(trim(p_rejection_reason)) < 5 THEN
                    RAISE EXCEPTION 'A valid rejection reason (min 5 chars) is mandatory when rejecting a report.'
                        USING ERRCODE = 'P0003';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT (v_is_reporter OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the reporter or a municipal official can cancel this report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from under_review to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'assigned' THEN
            IF p_new_status = 'in_progress' THEN
                IF NOT (v_is_assigned OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the assigned sanitation worker or an official can mark work in_progress.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can cancel an assigned report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from assigned to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'in_progress' THEN
            IF p_new_status = 'resolution_submitted' THEN
                IF NOT (v_is_assigned OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the assigned sanitation worker or an official can submit resolution.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'cancelled' THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can cancel an in-progress report.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from in_progress to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'resolution_submitted' THEN
            IF p_new_status = 'resolved' THEN
                IF NOT (v_is_official OR v_is_reporter) THEN
                    RAISE EXCEPTION 'Only an official or the reporting citizen can verify and resolve the complaint.'
                        USING ERRCODE = '42501';
                END IF;
            ELSIF p_new_status = 'in_progress' THEN
                IF NOT (v_is_official OR v_is_reporter) THEN
                    RAISE EXCEPTION 'Only an official or the reporting citizen can request rework.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from resolution_submitted to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'resolved' THEN
            IF p_new_status = 'reopened' THEN
                IF NOT (v_is_reporter OR v_is_official) THEN
                    RAISE EXCEPTION 'Only the reporter or a municipal official can reopen a resolved report.'
                        USING ERRCODE = '42501';
                END IF;
                IF NOT v_is_official AND v_report.resolved_at IS NOT NULL THEN
                    IF (timezone('utc'::text, now()) - v_report.resolved_at) > INTERVAL '72 hours' THEN
                        RAISE EXCEPTION 'Citizen complaint reopening window (72 hours) has expired. Please submit a new report.'
                            USING ERRCODE = 'P0005';
                    END IF;
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from resolved to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'reopened' THEN
            IF p_new_status IN ('under_review', 'assigned') THEN
                IF NOT v_is_official THEN
                    RAISE EXCEPTION 'Only municipal officials can triage reopened reports.'
                        USING ERRCODE = '42501';
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid transition from reopened to %.', p_new_status
                    USING ERRCODE = '22000';
            END IF;

        WHEN 'rejected', 'cancelled' THEN
            IF NOT v_is_official THEN
                RAISE EXCEPTION 'Cannot modify a terminal report status (%).', v_report.status
                    USING ERRCODE = '42501';
            END IF;
    END CASE;

    UPDATE public.reports
    SET status = p_new_status,
        rejection_reason = CASE
            WHEN p_new_status = 'rejected' THEN p_rejection_reason
            ELSE rejection_reason
        END,
        resolved_at = CASE
            WHEN p_new_status = 'resolved' THEN timezone('utc'::text, now())
            ELSE resolved_at
        END,
        reopened_at = CASE
            WHEN p_new_status = 'reopened' THEN timezone('utc'::text, now())
            ELSE reopened_at
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_report_id
    RETURNING * INTO v_report;

    INSERT INTO public.report_status_history (
        report_id,
        previous_status,
        new_status,
        actor_id,
        note
    ) VALUES (
        p_report_id,
        v_report.status,
        p_new_status,
        v_actor_id,
        p_note
    );

    RETURN v_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.track_complaint(p_complaint_id TEXT)
RETURNS TABLE (
    complaint_id TEXT,
    category public.complaint_category,
    status public.complaint_status,
    priority public.complaint_priority,
    ward_number INTEGER,
    address_locality TEXT,
    submitted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    reopened_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.complaint_id,
        r.category,
        r.status,
        r.priority,
        r.ward_number,
        r.address_locality,
        r.submitted_at,
        r.resolved_at,
        r.reopened_at
    FROM public.reports r
    WHERE r.complaint_id = trim(p_complaint_id)
       OR r.tracking_token::text = trim(p_complaint_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.transition_report_status(UUID, public.complaint_status, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_report_status(UUID, public.complaint_status, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assign_report(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_report(UUID, UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.track_complaint(TEXT) TO anon, authenticated;

