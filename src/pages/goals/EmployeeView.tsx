
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmployeeList from "@/components/goals/employee/EmployeeList";
import EmployeeGoalDashboard from "@/components/goals/employee/EmployeeGoalDashboard";
import { Employee } from "@/types/goal";
import { ArrowLeft, Users, Clock, CheckCircle, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const EmployeeView = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleEmployeeSelect = (employee: Employee) => {
    console.log("Selected employee:", employee);
    setSelectedEmployee(employee);
  };

  const handleBackToEmployees = () => {
    setSelectedEmployee(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedEmployee 
              ? `${selectedEmployee.name}'s Goals` 
              : "Employee Goals Dashboard"}
          </h1>
          <p className="text-gray-600">
            {selectedEmployee
              ? `View and update goals for ${selectedEmployee.name}`
              : "Select an employee to view their goals"}
          </p>
        </div>
        <div className="flex gap-4">
          {selectedEmployee && (
            <Button 
              variant="outline" 
              onClick={handleBackToEmployees}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Employees
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Admin Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {selectedEmployee ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 justify-center sm:justify-start">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              onClick={() => setActiveTab("all")}
              className="flex items-center gap-2"
            >
              <BarChart3 size={16} />
              All Goals
            </Button>
            <Button
              variant={activeTab === "daily" ? "default" : "outline"}
              onClick={() => setActiveTab("daily")}
              className="flex items-center gap-2"
            >
              <Clock size={16} />
              Daily
            </Button>
            <Button
              variant={activeTab === "weekly" ? "default" : "outline"}
              onClick={() => setActiveTab("weekly")}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              Weekly
            </Button>
            <Button
              variant={activeTab === "monthly" ? "default" : "outline"}
              onClick={() => setActiveTab("monthly")}
              className="flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Monthly
            </Button>
            <Button
              variant={activeTab === "yearly" ? "default" : "outline"}
              onClick={() => setActiveTab("yearly")}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Yearly
            </Button>
          </div>

          <EmployeeGoalDashboard 
            employee={selectedEmployee} 
            goalTypeFilter={activeTab !== "all" ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) as any : undefined}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Select an Employee
            </CardTitle>
            <CardDescription>
              Choose an employee to view and update their assigned goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeList onEmployeeSelect={handleEmployeeSelect} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeView;
