
-- Add hierarchical structure to teams
ALTER TABLE public.hr_teams 
ADD COLUMN IF NOT EXISTS parent_team_id UUID REFERENCES hr_teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_type TEXT DEFAULT 'team' CHECK (team_type IN ('department', 'team', 'sub_team')),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create team permissions table
CREATE TABLE IF NOT EXISTS public.hr_team_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES hr_teams(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_value BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES hr_employees(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, permission_key)
);

-- Create default permissions table
CREATE TABLE IF NOT EXISTS public.hr_default_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_description TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team audit logs table
CREATE TABLE IF NOT EXISTS public.hr_team_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES hr_teams(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  performed_by UUID REFERENCES hr_employees(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.hr_team_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_default_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_team_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team permissions
CREATE POLICY "Users can view team permissions in their organization" 
  ON public.hr_team_permissions FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM hr_employees WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage team permissions" 
  ON public.hr_team_permissions FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- Create RLS policies for default permissions
CREATE POLICY "Users can view default permissions in their organization" 
  ON public.hr_default_permissions FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM hr_employees WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage default permissions" 
  ON public.hr_default_permissions FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- Create RLS policies for audit logs
CREATE POLICY "Admins can view team audit logs" 
  ON public.hr_team_audit_logs FOR SELECT 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

CREATE POLICY "System can insert audit logs" 
  ON public.hr_team_audit_logs FOR INSERT 
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_hr_team_permissions_updated_at BEFORE UPDATE ON public.hr_team_permissions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default permissions
INSERT INTO public.hr_default_permissions (permission_key, permission_name, permission_description, category) VALUES
-- Analytics & Reporting
('view_team_analytics', 'View Team Analytics', 'Access to team productivity and performance reports', 'analytics'),
('view_attendance_reports', 'View Attendance Reports', 'Access to team attendance and time tracking data', 'analytics'),
('export_team_reports', 'Export Team Reports', 'Ability to export team data and reports', 'analytics'),

-- Task Management
('create_tasks', 'Create Tasks', 'Create new tasks for team members', 'task_management'),
('assign_tasks', 'Assign Tasks', 'Assign tasks to team members', 'task_management'),
('edit_tasks', 'Edit Tasks', 'Modify existing tasks', 'task_management'),
('delete_tasks', 'Delete Tasks', 'Remove tasks from the system', 'task_management'),

-- Leave Management
('approve_leave_requests', 'Approve Leave Requests', 'Approve or reject leave requests from team members', 'leave_management'),
('view_team_calendar', 'View Team Calendar', 'Access to team calendar and schedules', 'leave_management'),
('manage_shift_requests', 'Manage Shift Requests', 'Handle shift change requests', 'leave_management'),

-- Member Management
('add_team_members', 'Add Team Members', 'Add new members to the team', 'member_management'),
('remove_team_members', 'Remove Team Members', 'Remove members from the team', 'member_management'),
('view_member_details', 'View Member Details', 'Access to team member profiles and details', 'member_management'),
('edit_member_roles', 'Edit Member Roles', 'Modify roles of team members', 'member_management'),

-- Screen Monitoring
('view_activity_logs', 'View Activity Logs', 'Access to team member activity and productivity logs', 'monitoring'),
('view_screenshots', 'View Screenshots', 'Access to screen monitoring and screenshots', 'monitoring'),

-- Data Visibility
('view_sensitive_data', 'View Sensitive Data', 'Access to confidential team and member data', 'data_access'),
('manage_data_privacy', 'Manage Data Privacy', 'Control data visibility and privacy settings', 'data_access')
ON CONFLICT (permission_key) DO NOTHING;
