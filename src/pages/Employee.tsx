
import React, { useState, useEffect } from "react";
import { EmployeeTable } from "@/components/employee/EmployeeTable";
import { DashboardLayout } from "@/components/employee/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmployeeDetailsModal } from "@/components/employee/EmployeeDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import AddEmployeeModal from "@/components/Employee1/AddEmployeeModal";
import { useDisclosure } from "@chakra-ui/react";
import { UserPlus } from "lucide-react";

const Employee = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  // Handle edit by navigating to the edit form
  const handleEdit = (employee) => {
    navigate(`/employee/${employee.id}/edit`);
  };

  // Handle view by navigating to the employee details page
  const handleView = (employeeId) => {
    navigate(`/employee/${employeeId}`);
  };

  // Use the existing AddEmployeeModal for adding new employees
  const handleAddEmployeeFromModal = () => {
    onOpen(); // Open the AddEmployeeModal
  };

  // Use the red button to add employee through the form
  const handleAddEmployeeThroughForm = () => {
    navigate('/employee/add');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <div className="flex gap-4">
            <Button 
              onClick={handleAddEmployeeFromModal}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Add Employee
            </Button>
            <Button 
              onClick={handleAddEmployeeThroughForm} 
              className="bg-red-600 hover:bg-red-700"
            >
              <UserPlus className="w-3.5 h-3.5 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <EmployeeTable
          employees={employees}
          isLoading={isLoading}
          onEdit={handleEdit}
          onView={handleView}
        />

        {/* Use the existing AddEmployeeModal */}
        <AddEmployeeModal isOpen={isOpen} onClose={onClose} />
      </div>
    </DashboardLayout>
  );
};

export default Employee;
