-- Add archive_metadata column to form_submissions table
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS archive_metadata JSONB;

-- Make sure the status column exists and has the right type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE form_submissions ADD COLUMN status TEXT DEFAULT 'submitted';
  END IF;
END $$;

-- Update existing records to have 'submitted' status if null
UPDATE form_submissions SET status = 'submitted' WHERE status IS NULL;

-- Add comment to explain the status values
COMMENT ON COLUMN form_submissions.status IS 'Status of the submission: submitted, archived, etc.';
COMMENT ON COLUMN form_submissions.archive_metadata IS 'Metadata about archiving: reason, original form details, etc.';
