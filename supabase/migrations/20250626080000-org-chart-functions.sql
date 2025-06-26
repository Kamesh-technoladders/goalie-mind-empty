
-- Function to get all subordinates (direct and indirect) of an employee
CREATE OR REPLACE FUNCTION public.get_employee_subordinates(employee_id UUID)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  level INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    -- Base case: direct reports
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.email,
      1 as level
    FROM hr_employees e
    WHERE e.reporting_manager_id = employee_id
    AND e.status = 'active'
    
    UNION ALL
    
    -- Recursive case: indirect reports
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.email,
      s.level + 1
    FROM hr_employees e
    INNER JOIN subordinates s ON e.reporting_manager_id = s.id
    WHERE e.status = 'active'
    AND s.level < 10 -- Prevent infinite recursion
  )
  SELECT 
    subordinates.id,
    subordinates.first_name,
    subordinates.last_name,
    subordinates.email,
    subordinates.level
  FROM subordinates
  ORDER BY subordinates.level, subordinates.first_name;
END;
$$;

-- Function to get the management chain for an employee
CREATE OR REPLACE FUNCTION public.get_employee_management_chain(employee_id UUID)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  position TEXT,
  level INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE management_chain AS (
    -- Base case: the employee themselves
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.email,
      e.position,
      0 as level
    FROM hr_employees e
    WHERE e.id = employee_id
    AND e.status = 'active'
    
    UNION ALL
    
    -- Recursive case: managers up the chain
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.email,
      e.position,
      mc.level + 1
    FROM hr_employees e
    INNER JOIN management_chain mc ON e.id = mc.reporting_manager_id
    WHERE e.status = 'active'
    AND mc.level < 10 -- Prevent infinite recursion
  )
  SELECT 
    management_chain.id,
    management_chain.first_name,
    management_chain.last_name,
    management_chain.email,
    management_chain.position,
    management_chain.level
  FROM management_chain
  WHERE management_chain.level > 0 -- Exclude the employee themselves
  ORDER BY management_chain.level;
END;
$$;
