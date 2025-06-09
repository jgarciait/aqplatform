-- First, let's check if the column exists and add it if it doesn't
DO $$
BEGIN
    -- Check if archive_metadata column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'form_submissions' 
        AND column_name = 'archive_metadata'
        AND table_schema = 'public'
    ) THEN
        -- Add the archive_metadata column
        ALTER TABLE public.form_submissions ADD COLUMN archive_metadata JSONB;
        
        -- Add comment
        COMMENT ON COLUMN public.form_submissions.archive_metadata IS 'Metadata about archiving: reason, original form details, etc.';
    END IF;
    
    -- Ensure status column has proper default
    ALTER TABLE public.form_submissions ALTER COLUMN status SET DEFAULT 'submitted';
    
    -- Update any NULL status values to 'submitted'
    UPDATE public.form_submissions SET status = 'submitted' WHERE status IS NULL;
    
END $$;

-- Create an index on status for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON public.form_submissions(status);
