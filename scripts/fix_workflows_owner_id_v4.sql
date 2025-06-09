-- Fix workflows table owner_id constraint
-- First, let's see what columns exist and fix any constraint issues

-- Drop existing constraints if they exist
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_owner_id_fkey;

-- Make owner_id nullable temporarily to fix existing records
ALTER TABLE workflows ALTER COLUMN owner_id DROP NOT NULL;

-- Update any existing workflows without owner_id to use a default system user
-- You might want to replace this with an actual admin user ID from your system
UPDATE workflows 
SET owner_id = (
  SELECT id FROM auth.users LIMIT 1
) 
WHERE owner_id IS NULL;

-- Now make owner_id required again and add the foreign key constraint
ALTER TABLE workflows ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE workflows ADD CONSTRAINT workflows_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON workflows(owner_id);
