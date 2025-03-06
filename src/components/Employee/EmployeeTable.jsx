
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td, Button, useToast, Badge } from "@chakra-ui/react";
import { EditIcon, ViewIcon } from "@chakra-ui/icons";
import { supabase } from "@/integrations/supabase/client";

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Failed to fetch employees",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employeeId) => {
    navigate(`/edit-employee/${employeeId}`);
  };

  const handleView = (employeeId) => {
    navigate(`/employee/${employeeId}`);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'on_leave': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Employee ID</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <Tr key={employee.id}>
                  <Td>{employee.employee_id || '-'}</Td>
                  <Td>{`${employee.first_name || ''} ${employee.last_name || ''}`}</Td>
                  <Td>{employee.email || '-'}</Td>
                  <Td>{employee.phone || '-'}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(employee.employment_status || 'active')}>
                      {employee.employment_status || 'Active'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      leftIcon={<EditIcon />}
                      colorScheme="blue"
                      variant="outline"
                      mr={2}
                      onClick={() => handleEdit(employee.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<ViewIcon />}
                      colorScheme="green"
                      variant="outline"
                      onClick={() => handleView(employee.id)}
                    >
                      View
                    </Button>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center">
                  No employees found. Click "Add Employee" to create a new employee.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}
    </div>
  );
};

export default EmployeeTable;
