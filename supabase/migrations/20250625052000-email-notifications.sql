
-- Create email notifications table
CREATE TABLE IF NOT EXISTS public.hr_email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES hr_teams(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  recipients JSONB DEFAULT '[]'::jsonb,
  include_new_users BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'instant',
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, notification_type)
);

-- Create user permissions table for individual menu access
CREATE TABLE IF NOT EXISTS public.hr_user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_value BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES hr_employees(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

-- Create team members table if not exists
CREATE TABLE IF NOT EXISTS public.hr_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES hr_teams(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  added_by UUID REFERENCES hr_employees(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.hr_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for email notifications
CREATE POLICY "Users can view email notifications in their organization" 
  ON public.hr_email_notifications FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM hr_employees WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage email notifications" 
  ON public.hr_email_notifications FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- RLS policies for user permissions
CREATE POLICY "Users can view their own permissions" 
  ON public.hr_user_permissions FOR SELECT 
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

CREATE POLICY "Admins can manage user permissions" 
  ON public.hr_user_permissions FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- RLS policies for team members
CREATE POLICY "Users can view team members in their organization" 
  ON public.hr_team_members FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM hr_employees WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage team members" 
  ON public.hr_team_members FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- Add triggers for updated_at
CREATE TRIGGER update_hr_email_notifications_updated_at BEFORE UPDATE ON public.hr_email_notifications 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hr_user_permissions_updated_at BEFORE UPDATE ON public.hr_user_permissions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert menu access permissions
INSERT INTO public.hr_default_permissions (permission_key, permission_name, permission_description, category) VALUES
('access_dashboard', 'Access Dashboard', 'View main dashboard', 'menu_access'),
('access_user_management', 'User Management', 'Access user management module', 'menu_access'),
('access_team_management', 'Team Management', 'Access team management features', 'menu_access'),
('access_client_management', 'Client Management', 'Access client management module', 'menu_access'),
('access_project_management', 'Project Management', 'Access project management features', 'menu_access'),
('access_reports', 'Reports & Analytics', 'Access reporting features', 'menu_access'),
('access_settings', 'System Settings', 'Access system configuration', 'menu_access')
ON CONFLICT (permission_key) DO NOTHING;
