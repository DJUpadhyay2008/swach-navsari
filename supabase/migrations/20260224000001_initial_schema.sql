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
