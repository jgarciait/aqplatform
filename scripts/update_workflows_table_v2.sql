-- Update workflows table to include additional fields for the enhanced workflow system

-- Add new columns if they don't exist
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES forms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS workflow_data JSONB DEFAULT '{}';

-- Update existing workflows to have proper structure
UPDATE workflows 
SET workflow_data = '{
  "nodes": [],
  "connections": []
}'::jsonb
WHERE workflow_data IS NULL OR workflow_data = '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_form_id ON workflows(form_id);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_active ON workflows(workspace_id, is_active);
