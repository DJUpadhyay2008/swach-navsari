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
