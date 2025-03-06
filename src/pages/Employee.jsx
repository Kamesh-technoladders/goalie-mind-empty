
import React from "react";
import { useSelector } from "react-redux";
import EmployeeTable from "../components/Employee/EmployeeTable";
import { useNavigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";

const Employee = () => {
  const { role } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // For development, bypass role checks
  const hasAccess = true; // In production this would check roles
  
  if (!hasAccess) {
    return <div>Unauthorized Access</div>;
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <Button colorScheme="blue" onClick={() => navigate("/add-employee")}>
          + Add Employee
        </Button>
      </div>
      <EmployeeTable />
    </div>
  );
};

export default Employee;
