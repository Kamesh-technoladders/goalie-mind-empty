
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Employee, GoalWithDetails } from "@/types/goal";
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Calendar, Target } from "lucide-react";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

interface EmployeeGoalCardProps {
  goal: GoalWithDetails;
  employee: Employee;
}

const EmployeeGoalCard: React.FC<EmployeeGoalCardProps> = ({ goal, employee }) => {
  const navigate = useNavigate();
  const [currentValue, setCurrentValue] = useState<number>(0);
  
  // Use active instance if available, otherwise fall back to assignment details
  const displayDetails = goal.activeInstance || goal.assignmentDetails;
  const status = displayDetails?.status || 'pending';
  const progress = displayDetails?.progress || 0;

  // Check if this is a special goal type (Submission or Onboarding)
  const isSpecialGoal = goal.name === "Submission" || goal.name === "Onboarding";
  
  useEffect(() => {
    // For regular goals, just use the current value from the goal
    if (!isSpecialGoal) {
      setCurrentValue(displayDetails?.currentValue || 0);
      return;
    }
    
    // For special goals, fetch the current value from hr_status_change_counts
    const fetchCurrentValue = async () => {
      let subStatusId: string | null = null;
      if (goal.name === "Submission") {
        subStatusId = "71706ff4-1bab-4065-9692-2a1237629dda";
      } else if (goal.name === "Onboarding") {
        subStatusId = "c9716374-3477-4606-877a-dfa5704e7680";
      }
  
      console.log("fetchCurrentValue: Goal Name:", goal.name, "Sub Status ID:", subStatusId);
  
      if (!subStatusId || !goal.activeInstance) {
        console.log(
          "fetchCurrentValue: No subStatusId or activeInstance, using fallback currentValue:",
          displayDetails?.currentValue || 0
        );
        setCurrentValue(displayDetails?.currentValue || 0);
        return;
      }
  
      try {
        // Add one day to periodEnd to include the full day
        const periodEndPlusOne = new Date(goal.activeInstance.periodEnd);
        periodEndPlusOne.setDate(periodEndPlusOne.getDate() + 1);
  
        console.log("fetchCurrentValue: Query Parameters:", {
          sub_status_id: subStatusId,
          candidate_owner: employee.id,
          period_start: goal.activeInstance.periodStart,
          period_end: periodEndPlusOne.toISOString().split("T")[0],
        });
  
        const { data, error } = await supabase
          .from("hr_status_change_counts")
          .select("count")
          .eq("sub_status_id", subStatusId)
          .eq("candidate_owner", employee.id)
          .gte("created_at", goal.activeInstance.periodStart)
          .lt("created_at", periodEndPlusOne.toISOString().split("T")[0]);
  
        if (error) {
          console.error("fetchCurrentValue: Supabase Error:", error);
          setCurrentValue(displayDetails?.currentValue || 0);
          return;
        }
  
        console.log("fetchCurrentValue: Supabase Data:", data);
  
        // Sum the counts
        const totalCount = data.reduce((sum: number, record: { count: number }) => sum + record.count, 0);
        console.log("fetchCurrentValue: Calculated totalCount:", totalCount);
  
        setCurrentValue(totalCount);
      } catch (err) {
        console.error("fetchCurrentValue: Unexpected Error:", err);
        setCurrentValue(displayDetails?.currentValue || 0);
      }
    };
  
    fetchCurrentValue();
  }, [goal.id, employee.id, goal.activeInstance?.periodStart, goal.activeInstance?.periodEnd]);
  
  // Get period text based on goal type
  const getPeriodText = () => {
    const goalType = goal.assignmentDetails?.goalType || "Standard";
    
    if (goal.activeInstance) {
      const startDate = format(new Date(goal.activeInstance.periodStart), 'MMM d');
      const endDate = format(new Date(goal.activeInstance.periodEnd), 'MMM d');
      return `Current ${goalType} Period: ${startDate} - ${endDate}`;
    } else {
      return `${goalType} Goal`;
    }
  };

  // Get icon based on status
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

  // Get badge color based on status
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
  
  // Get the recurring interval type text
  const getIntervalTypeText = () => {
    if (!goal.assignmentDetails) return "";
    return `${goal.assignmentDetails.goalType} Goal`;
  };

  const handleViewDetails = () => {
    navigate(`/goals/${goal.id}`, { state: { employee } });
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
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Target</span>
            <span>
              {goal.activeInstance ? (
                <span>
                  {isSpecialGoal ? currentValue : goal.activeInstance.currentValue} / {goal.activeInstance.targetValue}
                  <span className="ml-1 text-xs text-gray-500">{goal.metricUnit}</span>
                </span>
              ) : (
                <span>
                  {isSpecialGoal ? currentValue : displayDetails?.currentValue || 0} / {displayDetails?.targetValue || goal.targetValue}
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
