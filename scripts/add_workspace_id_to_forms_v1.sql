-- Add workspace_id column to forms table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forms' AND column_name='workspace_id') THEN
        ALTER TABLE public.forms
        ADD COLUMN workspace_id uuid;

        -- Update existing forms to associate them with a default workspace if needed
        -- This assumes you have a way to get a default workspace ID, or you can set it to NULL initially
        -- For now, we'll leave it as NULL, and the application logic will handle assigning it.
        -- ALTER TABLE public.forms
        -- ALTER COLUMN workspace_id SET DEFAULT 'your-default-workspace-uuid';

        -- Add foreign key constraint
        ALTER TABLE public.forms
        ADD CONSTRAINT fk_forms_workspace
        FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL; -- Or ON DELETE CASCADE if forms should be deleted with workspace
    END IF;
END
$$;
