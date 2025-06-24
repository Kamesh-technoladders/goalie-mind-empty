
-- Create shifts table for managing work schedules
CREATE TABLE public.hr_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 60,
  days_of_week TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teams table (separate from departments for better organization)
CREATE TABLE public.hr_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES hr_employees(id),
  department_id UUID REFERENCES hr_departments(id),
  organization_id UUID REFERENCES hr_organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team members junction table
CREATE TABLE public.hr_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES hr_teams(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES hr_organizations(id),
  UNIQUE(team_id, employee_id)
);

-- Add missing columns to hr_employees for full user management
ALTER TABLE public.hr_employees 
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES hr_shifts(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS last_working_day DATE;

-- Enable RLS on new tables
ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shifts
CREATE POLICY "Users can view shifts in their organization" 
  ON public.hr_shifts FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM hr_employees WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage shifts" 
  ON public.hr_shifts FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- Create RLS policies for teams
CREATE POLICY "Users can view teams in their organization" 
  ON public.hr_teams FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM hr_employees WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage teams" 
  ON public.hr_teams FOR ALL 
  USING (organization_id IN (
    SELECT e.organization_id FROM hr_employees e 
    JOIN hr_roles r ON e.role_id = r.id 
    WHERE e.id = auth.uid() 
    AND r.name IN ('organization_superadmin', 'admin')
  ));

-- Create RLS policies for team members
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

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hr_shifts_updated_at BEFORE UPDATE ON public.hr_shifts 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hr_teams_updated_at BEFORE UPDATE ON public.hr_teams 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
