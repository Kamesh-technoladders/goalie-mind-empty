
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fetch employees for the given organization
export const fetchEmployees = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('hr_employees')
      .select('id, first_name, last_name, email, department_id, role_id')
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }

    return data.map(employee => ({
      value: employee.id,
      label: `${employee.first_name} ${employee.last_name}`
    }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// Fetch departments for the given organization
export const fetchDepartments = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('hr_departments')
      .select('id, name')
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }

    return data.map(department => ({
      value: department.id,
      label: department.name
    }));
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

// Fetch vendors for the given organization
export const fetchVendors = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('hr_clients')
      .select('id, client_name')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    return data.map(vendor => ({
      value: vendor.id,
      label: vendor.client_name
    }));
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw error;
  }
};

// Assign a job to an individual, team, or vendor
export const assignJob = async (
  jobId: string, 
  assignmentType: 'individual' | 'team' | 'vendor', 
  assignmentId: string,
  assignmentName: string,
  budget?: string,
  budgetType?: string,
  userId?: string
) => {
  try {
    const assignmentData = {
      assigned_to: {
        type: assignmentType,
        id: assignmentId,
        name: assignmentName
      },
      updated_by: userId
    };

    if (assignmentType === 'vendor' && budget) {
      assignmentData.assigned_to.budget = budget;
      assignmentData.assigned_to.budgetType = budgetType;
    }

    const { data, error } = await supabase
      .from('hr_jobs')
      .update(assignmentData)
      .eq('id', jobId)
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error("Error assigning job:", error);
    throw error;
  }
};
