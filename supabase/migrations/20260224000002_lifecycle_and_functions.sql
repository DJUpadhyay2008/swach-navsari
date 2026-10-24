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
