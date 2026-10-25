-- ==============================================================================
-- S.W.A.C.H. Navsari — Migration 06: Security Hardening & Lifecycle Integrity
-- Systematic Waste Action & Cleanliness Hub, Navsari, Gujarat, India
-- Additive Migration (Preserves all existing data and tables)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Search Path Hardening on Existing Helper Functions
-- Prevents search_path hijacking vulnerabilities in trigger functions.
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- 2. High-Entropy Public Tracking Token
-- Adds an unguessable UUID tracking token to prevent sequential ID enumeration.
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- 3. Worker Task History Access Fix
-- Workers must be able to view their completed assignments in the "Completed" tab
-- without losing RLS read permissions on the report.
-- ------------------------------------------------------------------------------

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

-- Update Storage Read Policy for report-evidence to include completed assignments
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

-- ------------------------------------------------------------------------------
-- 4. 72-Hour Reopening Policy Enforcement
-- Citizens can only reopen resolved complaints within a 72-hour window.
-- Municipal officials retain authority to reopen at any time.
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
                -- 72-Hour rule: Citizens can only reopen within 72 hours of resolution
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
            -- Terminal states; can only be reopened by municipal official with note
            IF NOT v_is_official THEN
                RAISE EXCEPTION 'Cannot modify a terminal report status (%).', v_report.status
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
-- 5. Safe Public Tracking Function (Supports Complaint ID or Tracking Token)
-- Strict data minimization: Excludes citizen ID, contact info, exact coordinates,
-- internal audit notes, and private evidence storage paths.
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
    WHERE r.complaint_id = trim(p_complaint_id)
       OR r.tracking_token::text = trim(p_complaint_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 6. Narrow RPC Execution Privileges
-- Revoke execution from public/anon on privileged mutation functions
-- ------------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.transition_report_status(UUID, public.complaint_status, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_report_status(UUID, public.complaint_status, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assign_report(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_report(UUID, UUID, TEXT) TO authenticated;

-- Public tracking function is intentionally accessible to anon and authenticated
GRANT EXECUTE ON FUNCTION public.track_complaint(TEXT) TO anon, authenticated;
