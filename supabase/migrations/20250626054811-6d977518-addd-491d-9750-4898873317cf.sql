
-- Add reporting_manager_id column to hr_employees table
ALTER TABLE public.hr_employees 
ADD COLUMN reporting_manager_id UUID REFERENCES public.hr_employees(id) ON DELETE SET NULL;

-- Add index for better performance on hierarchy queries
CREATE INDEX idx_hr_employees_reporting_manager ON public.hr_employees(reporting_manager_id);

-- Add comment for clarity
COMMENT ON COLUMN public.hr_employees.reporting_manager_id IS 'References the employee who is the reporting manager for this employee';
