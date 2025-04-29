
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeGoals } from "@/lib/supabaseData";
import { Employee, GoalType, GoalWithDetails } from "@/types/goal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Clock, CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";
import EmployeeGoalCard from "./EmployeeGoalCard";

interface EmployeeGoalDashboardProps {
  employee: Employee;
  goalTypeFilter?: GoalType;
}

const EmployeeGoalDashboard: React.FC<EmployeeGoalDashboardProps> = ({ 
  employee,
  goalTypeFilter 
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: goals, isLoading, error } = useQuery({
    queryKey: ["employeeGoals", employee.id],
    queryFn: () => getEmployeeGoals(employee.id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !goals || goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <h3 className="text-lg font-medium">No Goals Assigned</h3>
            <p className="text-gray-500 mt-2">
              This employee doesn't have any goals assigned yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter goals by type if filter is set
  const filteredByType = goalTypeFilter 
    ? goals.filter(goal => goal.assignmentDetails?.goalType === goalTypeFilter) 
    : goals;

  // Then filter by status
  const filteredGoals = selectedStatus === "all" 
    ? filteredByType 
    : filteredByType.filter(goal => {
        const status = goal.activeInstance?.status || goal.assignmentDetails?.status;
        return status === selectedStatus;
      });

  // Calculate summary statistics
  const totalGoals = filteredByType.length;
  const completedGoals = filteredByType.filter(
    g => g.activeInstance?.status === "completed" || g.assignmentDetails?.status === "completed"
  ).length;
  const inProgressGoals = filteredByType.filter(
    g => g.activeInstance?.status === "in-progress" || g.assignmentDetails?.status === "in-progress"
  ).length;
  const overdueGoals = filteredByType.filter(
    g => g.activeInstance?.status === "overdue" || g.assignmentDetails?.status === "overdue"
  ).length;

  // Group by goal type
  const goalsByType = filteredByType.reduce((acc, goal) => {
    if (goal.assignmentDetails?.goalType) {
      const type = goal.assignmentDetails.goalType;
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{totalGoals}</CardTitle>
            <CardDescription>Total Goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(goalsByType).map(([type, count]) => (
                <Badge key={type} variant="outline">
                  {count} {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-2xl font-bold">{completedGoals}</CardTitle>
            </div>
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-2xl font-bold">{inProgressGoals}</CardTitle>
            </div>
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={totalGoals > 0 ? (inProgressGoals / totalGoals) * 100 : 0}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-2xl font-bold">{overdueGoals}</CardTitle>
            </div>
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={totalGoals > 0 ? (overdueGoals / totalGoals) * 100 : 0}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setSelectedStatus}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="in-progress">
                <BarChart3 className="h-4 w-4 mr-2" />
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="overdue">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Overdue
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGoals.map((goal) => (
                  <EmployeeGoalCard key={goal.id} goal={goal} employee={employee} />
                ))}
              </div>
              {filteredGoals.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">No goals found with the selected filter</p>
                </div>
              )}
            </TabsContent>

            {["in-progress", "completed", "overdue", "pending"].map((status) => (
              <TabsContent key={status} value={status} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGoals.map((goal) => (
                    <EmployeeGoalCard key={goal.id} goal={goal} employee={employee} />
                  ))}
                </div>
                {filteredGoals.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No {status.replace('-', ' ')} goals found</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeGoalDashboard;
