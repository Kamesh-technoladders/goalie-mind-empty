
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Employee, GoalWithDetails } from "@/types/goal";
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Calendar, Target } from "lucide-react";
import { format } from 'date-fns';

interface EmployeeGoalCardProps {
  goal: GoalWithDetails;
  employee: Employee;
}

const EmployeeGoalCard: React.FC<EmployeeGoalCardProps> = ({ goal, employee }) => {
  const navigate = useNavigate();
  
  // Use active instance if available, otherwise fall back to assignment details
  const displayDetails = goal.activeInstance || goal.assignmentDetails;
  const status = displayDetails?.status || 'pending';
  const progress = displayDetails?.progress || 0;
  
  // Format dates
  const getPeriodText = () => {
    if (goal.activeInstance) {
      const startDate = format(new Date(goal.activeInstance.periodStart), 'MMM d');
      const endDate = format(new Date(goal.activeInstance.periodEnd), 'MMM d');
      return `Current Period: ${startDate} - ${endDate}`;
    } else {
      const startDate = format(new Date(goal.startDate), 'MMM d');
      const endDate = format(new Date(goal.endDate), 'MMM d');
      return `${startDate} - ${endDate}`;
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
                  {goal.activeInstance.currentValue} / {goal.activeInstance.targetValue}
                  <span className="ml-1 text-xs text-gray-500">{goal.metricUnit}</span>
                </span>
              ) : (
                <span>
                  {displayDetails?.currentValue || 0} / {displayDetails?.targetValue || goal.targetValue}
                  <span className="ml-1 text-xs text-gray-500">{goal.metricUnit}</span>
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-4">
        <Button 
          variant="default" 
          className="w-full" 
          onClick={handleViewDetails}
        >
          View & Update Progress
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmployeeGoalCard;
