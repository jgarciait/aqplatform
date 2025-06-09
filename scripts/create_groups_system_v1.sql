-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    group_type VARCHAR(50) NOT NULL CHECK (group_type IN ('sender', 'requester', 'approver')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, workspace_id)
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create workflow_permissions table to define who can request/approve for each workflow
CREATE TABLE IF NOT EXISTS workflow_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('requester', 'approver')),
    assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('individual', 'group', 'all_non_approvers')),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    approval_level INTEGER, -- For approvers, which level they can approve
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure proper assignment based on type
    CONSTRAINT check_assignment_consistency CHECK (
        (assignment_type = 'individual' AND user_id IS NOT NULL AND group_id IS NULL) OR
        (assignment_type = 'group' AND group_id IS NOT NULL AND user_id IS NULL) OR
        (assignment_type = 'all_non_approvers' AND user_id IS NULL AND group_id IS NULL)
    )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_workspace_id ON groups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(group_type);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_workflow_id ON workflow_permissions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_user_id ON workflow_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_group_id ON workflow_permissions(group_id);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view groups in their workspace" ON groups
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage groups in their workspace" ON groups
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_users 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- RLS Policies for group_members
CREATE POLICY "Users can view group members in their workspace" ON group_members
    FOR SELECT USING (
        group_id IN (
            SELECT g.id FROM groups g
            JOIN workspace_users wu ON g.workspace_id = wu.workspace_id
            WHERE wu.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage group members in their workspace" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT g.id FROM groups g
            JOIN workspace_users wu ON g.workspace_id = wu.workspace_id
            WHERE wu.user_id = auth.uid() AND wu.role IN ('admin', 'owner')
        )
    );

-- RLS Policies for workflow_permissions
CREATE POLICY "Users can view workflow permissions in their workspace" ON workflow_permissions
    FOR SELECT USING (
        workflow_id IN (
            SELECT w.id FROM workflows w
            JOIN workspace_users wu ON w.workspace_id = wu.workspace_id
            WHERE wu.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage workflow permissions in their workspace" ON workflow_permissions
    FOR ALL USING (
        workflow_id IN (
            SELECT w.id FROM workflows w
            JOIN workspace_users wu ON w.workspace_id = wu.workspace_id
            WHERE wu.user_id = auth.uid() AND wu.role IN ('admin', 'owner')
        )
    );

-- Create updated_at trigger for groups
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
