
import React, { useState, useEffect } from "react";
import { EmployeeTable } from "@/components/employee/EmployeeTable";
import { DashboardLayout } from "@/components/employee/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmployeeDetailsModal } from "@/components/employee/EmployeeDetailsModal";
import { supabase } from "@/integrations/supabase/client";

const Employee = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("hr_employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employee) => {
    navigate(`/employee/${employee.id}`);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleCreateEmployee = async (basicData) => {
    try {
      setIsLoading(true);
      
      // Generate employee ID based on first and last name
      const empId = `${basicData.firstName.substring(0, 1)}${basicData.lastName.substring(0, 1)}${Date.now().toString().slice(-6)}`;
      
      const { data, error } = await supabase
        .from("hr_employees")
        .insert({
          employee_id: empId,
          first_name: basicData.firstName,
          last_name: basicData.lastName,
          email: basicData.email,
          phone: basicData.phone || null,
          employment_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Employee created successfully");
      setIsModalOpen(false);
      fetchEmployees();
      navigate(`/employee/${data.id}`);
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(error.message || "Failed to create employee");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <Button 
            onClick={handleAddEmployee}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add Employee
          </Button>
        </div>

        <EmployeeTable
          employees={employees}
          isLoading={isLoading}
          onEdit={handleEdit}
        />

        <EmployeeDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateEmployee}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default Employee;
