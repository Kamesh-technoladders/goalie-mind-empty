
import { supabase } from "@/integrations/supabase/client";
import { EmployeeBasicInfo, EmployeeDetailsResponse } from "../types/employee.types";

export const employeeDataService = {
  async fetchEmployeeDetails(employeeId: string) {
    try {
      const { data: employeeWithRelations, error: queryError } = await supabase
        .rpc('get_employee_details', {
          p_employee_id: employeeId
        });

      if (queryError) {
        console.error("Error fetching employee details:", queryError);
        return null;
      }
      
      if (!employeeWithRelations) {
        console.warn("No employee found with ID:", employeeId);
        return null;
      }

      return (employeeWithRelations as unknown) as EmployeeDetailsResponse;
    } catch (error) {
      console.error("Exception in fetchEmployeeDetails:", error);
      return null;
    }
  },

  async updateBasicInfo(employeeId: string, data: EmployeeBasicInfo) {
    try {
      const { error } = await supabase
        .from('hr_employees')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          blood_group: data.bloodGroup,
          marital_status: data.maritalStatus
        })
        .eq('id', employeeId);

      if (error) {
        console.error("Error updating employee basic info:", error);
      }
      
      return { success: !error, error: error?.message };
    } catch (error: any) {
      console.error("Exception in updateBasicInfo:", error);
      return { success: false, error: error.message };
    }
  },
  
  async fetchAllEmployees() {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching employees:", error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Exception in fetchAllEmployees:", error);
      return [];
    }
  }
};
