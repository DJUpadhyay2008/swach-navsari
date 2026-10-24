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
