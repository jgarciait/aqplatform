-- Add type column to workspaces table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='type') THEN
        ALTER TABLE public.workspaces
        ADD COLUMN type TEXT CHECK (type IN ('sender', 'recipient'));
    END IF;
END
$$;
