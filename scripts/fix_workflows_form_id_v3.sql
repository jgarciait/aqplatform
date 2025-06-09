-- Fix the form_id column to allow NULL values during workflow creation

-- First, drop the existing constraint if it exists
ALTER TABLE workflows 
DROP CONSTRAINT IF EXISTS workflows_form_id_fkey;

-- Drop the column and recreate it properly
ALTER TABLE workflows 
DROP COLUMN IF EXISTS form_id;

-- Add the form_id column as nullable
ALTER TABLE workflows 
ADD COLUMN form_id UUID;

-- Add the foreign key constraint that allows NULL
ALTER TABLE workflows 
ADD CONSTRAINT workflows_form_id_fkey 
FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_form_id ON workflows(form_id);
