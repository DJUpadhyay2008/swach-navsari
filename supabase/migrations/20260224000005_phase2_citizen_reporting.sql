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
