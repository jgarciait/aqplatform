-- Create document_mappings table to store PDF mapping elements
CREATE TABLE IF NOT EXISTS document_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  elements_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_mappings_document_id ON document_mappings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_mappings_created_at ON document_mappings(created_at);

-- Add RLS policy for document mappings
ALTER TABLE document_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view document mappings if they have access to the workspace
CREATE POLICY "Users can view document mappings based on workspace access" ON document_mappings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_users wu ON d.workspace_id = wu.workspace_id
      WHERE d.id = document_id AND wu.user_id = auth.uid()
    )
  );

-- Policy: Users can insert document mappings if they have access to the workspace
CREATE POLICY "Users can insert document mappings if workspace member" ON document_mappings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_users wu ON d.workspace_id = wu.workspace_id
      WHERE d.id = document_id AND wu.user_id = auth.uid()
    )
  );

-- Policy: Users can update document mappings if they have access to the workspace
CREATE POLICY "Users can update document mappings if workspace member" ON document_mappings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_users wu ON d.workspace_id = wu.workspace_id
      WHERE d.id = document_id AND wu.user_id = auth.uid()
    )
  );

-- Policy: Users can delete document mappings if they have access to the workspace
CREATE POLICY "Users can delete document mappings if workspace member" ON document_mappings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspace_users wu ON d.workspace_id = wu.workspace_id
      WHERE d.id = document_id AND wu.user_id = auth.uid()
    )
  );

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_document_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_mappings_updated_at
  BEFORE UPDATE ON document_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_document_mappings_updated_at(); 