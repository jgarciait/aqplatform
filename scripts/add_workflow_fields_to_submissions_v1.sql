-- Add workflow-related fields to form_submissions table
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id),
ADD COLUMN IF NOT EXISTS current_workflow_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS workflow_state JSONB DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_workflow_id ON form_submissions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_current_level ON form_submissions(current_workflow_level);
CREATE INDEX IF NOT EXISTS idx_form_submissions_workflow_state ON form_submissions USING GIN(workflow_state);

-- Add comments to explain the new columns
COMMENT ON COLUMN form_submissions.workflow_id IS 'Foreign key to workflows table - which workflow this submission follows';
COMMENT ON COLUMN form_submissions.current_workflow_level IS 'Current level/step in the workflow (1-based index)';
COMMENT ON COLUMN form_submissions.workflow_state IS 'JSON object tracking workflow progress, decisions, assignments, etc.';

-- Example workflow_state structure:
-- {
--   "level_history": [
--     {
--       "level": 1,
--       "assigned_to": "user_id",
--       "status": "pending|approved|rejected",
--       "decision": "approve|reject|request_changes",
--       "comments": "Optional comments",
--       "timestamp": "2024-01-01T00:00:00Z"
--     }
--   ],
--   "current_assignee": "user_id",
--   "pending_action": "review|approve|reject",
--   "metadata": {}
-- }
