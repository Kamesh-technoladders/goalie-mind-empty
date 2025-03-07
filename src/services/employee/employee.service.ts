
import { supabase } from "@/integrations/supabase/client";
import { Document } from "../types/employee.types";
import { PostgrestResponse } from "@supabase/supabase-js";

class EmployeeService {
  async getEmployee(id: string) {
    try {
      // Use the specific table name from the available options
      const { data, error } = await supabase
        .from("hr_employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(`Error fetching employee: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error in getEmployee:", error);
      throw error;
    }
  }

  async createEmployee(employeeData: any) {
    // Implementation to create an employee
    try {
      const { error } = await supabase
        .from("hr_employees")
        .insert(employeeData);

      if (error) {
        throw new Error(`Error creating employee: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error in createEmployee:", error);
      throw error;
    }
  }

  async updateEmployee(id: string, employeeData: any) {
    try {
      const { error } = await supabase
        .from("hr_employees")
        .update(employeeData)
        .eq("id", id);

      if (error) {
        throw new Error(`Error updating employee: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateEmployee:", error);
      throw error;
    }
  }

  // Add more methods as needed for employee operations
}

export const employeeService = new EmployeeService();
