import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Employee, GoalInstance, GoalWithDetails } from "@/types/goal";
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Calendar, Target } from "lucide-react";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

interface EmployeeGoalCardProps {
  goal: GoalWithDetails;
  goalInstance: GoalInstance;
  employee: Employee;
}

const EmployeeGoalCard: React.FC<EmployeeGoalCardProps> = ({ goal, goalInstance, employee }) => {
  const navigate = useNavigate();
  const [currentValue, setCurrentValue] = useState<number>(goalInstance.currentValue ?? 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState(goalInstance.status ?? 'pending');
  const [progress, setProgress] = useState(goalInstance.progress ?? 0);

  const isSpecialGoal = goal.name === "Submission" || goal.name === "Onboarding";

  console.log("EmployeeGoalCard: Initial Props", {
    goal: {
      id: goal.id,
      name: goal.name,
      sector: goal.sector,
      description: goal.description,
      metricUnit: goal.metricUnit,
      targetValue: goal.targetValue
    },
    goalInstance: {
      id: goalInstance.id,
      periodStart: goalInstance.periodStart,
      periodEnd: goalInstance.periodEnd,
      targetValue: goalInstance.targetValue,
      currentValue: goalInstance.currentValue,
      status: goalInstance.status,
      progress: goalInstance.progress
    },
    employee: {
      id: employee.id,
      name: employee.name
    }
  });

  useEffect(() => {
    const updateInstanceIfNeeded = async () => {
      // Load the initial values from the instance
      setCurrentValue(goalInstance.currentValue ?? 0);
      setStatus(goalInstance.status ?? 'pending');
      setProgress(goalInstance.progress ?? 0);
      setLoading(false);
      
      // If this is a special goal, also try to refresh the data from the server
      if (isSpecialGoal) {
        try {
          // Rather than calculating in frontend, trigger the server to update
          const { updateSpecificSpecialGoal } = await import('@/lib/supabaseData');
          await updateSpecificSpecialGoal(goal.id);
          
          // Fetch the updated instance data after the server has updated it
          const { data, error } = await supabase
            .from("hr_goal_instances")
            .select("*")
            .eq("id", goalInstance.id)
            .single();
            
          if (!error && data) {
            console.log("SpecialGoal: Fetched updated instance data", data);
            setCurrentValue(data.current_value ?? 0);
            setStatus(data.status ?? 'pending');
            setProgress(data.progress ?? 0);
          }
        } catch (err) {
          console.error("Error refreshing special goal data:", err);
        }
      }
    };

    updateInstanceIfNeeded();
  }, [goal.id, goalInstance.id, isSpecialGoal]);

  const getPeriodText = () => {
    const goalType = goal.assignmentDetails?.goalType || "Standard";
    const startDate = format(new Date(goalInstance.periodStart), 'MMM d, yyyy');
    const endDate = format(new Date(goalInstance.periodEnd), 'MMM d, yyyy');
    return `${goalType} Period: ${startDate} - ${endDate}`;
  };

  const statusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getBadgeClasses = () => {
    switch (status) {
      case 'completed':
        return "bg-green-100 text-green-800 border-green-200";
      case 'in-progress':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'overdue':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getIntervalTypeText = () => {
    return goal.assignmentDetails?.goalType ? `${goal.assignmentDetails.goalType} Goal` : "Goal";
  };

  const handleViewDetails = () => {
    navigate(`/goals/${goal.id}/${goalInstance.id}`, { state: { employee, goalInstance } });
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2">
            {goal.sector}
          </Badge>
          <Badge variant="outline" className={getBadgeClasses()}>
            <span className="flex items-center">
              {statusIcon()}
              <span className="ml-1 capitalize">{status}</span>
            </span>
          </Badge>
        </div>
        <CardTitle className="text-lg">{goal.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-gray-500 mb-3">
          {goal.description}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {getPeriodText()}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Target className="h-4 w-4 mr-1" />
            {getIntervalTypeText()}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            {loading ? (
              <div className="h-2 w-full bg-gray-100 rounded overflow-hidden">
                <div className="h-full bg-gray-300 animate-pulse"></div>
              </div>
            ) : (
              <Progress value={progress} className="h-2" />
            )}
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Target</span>
            <span>
              {loading ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                <span>
                  {currentValue} / {goalInstance.targetValue ?? goal.targetValue}
                  <span className="ml-1 text-xs text-gray-500">{goal.metricUnit}</span>
                </span>
              )}
            </span>
          </div>
          
          {isSpecialGoal && (
            <div className="text-xs text-blue-600 italic">
              *Values auto-calculated from {goal.name} records
            </div>
          )}
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-4">
        <Button 
          variant="default" 
          className="w-full" 
          onClick={handleViewDetails}
        >
          View {isSpecialGoal ? "Details" : "& Update Progress"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmployeeGoalCard;
