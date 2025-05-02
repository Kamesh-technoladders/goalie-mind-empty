
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, Clock, AlertTriangle, CheckCircle2, Calendar, Target,
  Edit, Trash2, StopCircle, Plus
} from "lucide-react";
import { format } from 'date-fns';
import { 
  Employee, 
  GoalInstance, 
  GoalWithDetails 
} from "@/types/goal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface GoalCardProps {
  goal: GoalWithDetails;
  goalInstance: GoalInstance;
  employee?: Employee;
  onUpdate?: () => void;
  allowManagement?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  goalInstance, 
  employee, 
  onUpdate,
  allowManagement = false
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showStopDialog, setShowStopDialog] = useState<boolean>(false);
  const [showExtendDialog, setShowExtendDialog] = useState<boolean>(false);
  const [newTargetValue, setNewTargetValue] = useState<number>(goalInstance.targetValue);
  const [additionalTarget, setAdditionalTarget] = useState<number>(0);

  const isSpecialGoal = goal.name === "Submission" || goal.name === "Onboarding";
  const isCompleted = goalInstance.status === "completed";
  
  // Status icon and badge styles
  const statusIcon = () => {
    switch (goalInstance.status) {
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
    switch (goalInstance.status) {
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

  const getPeriodText = () => {
    const goalType = goal.assignmentDetails?.goalType || "Standard";
    const startDate = format(new Date(goalInstance.periodStart), 'MMM d, yyyy');
    const endDate = format(new Date(goalInstance.periodEnd), 'MMM d, yyyy');
    return `${goalType} Period: ${startDate} - ${endDate}`;
  };

  const getIntervalTypeText = () => {
    return goal.assignmentDetails?.goalType ? `${goal.assignmentDetails.goalType} Goal` : "Goal";
  };

  const handleUpdateTarget = async () => {
    if (!allowManagement) return;
    setLoading(true);
    
    try {
      // Update target value logic would go here
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Target updated",
        description: `Target for ${goal.name} updated to ${newTargetValue} ${goal.metricUnit}`,
      });
      
      if (onUpdate) onUpdate();
      setShowEditDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update target value",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!allowManagement) return;
    setLoading(true);
    
    try {
      // Delete goal logic would go here
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Goal deleted",
        description: `${goal.name} has been deleted`,
      });
      
      if (onUpdate) onUpdate();
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopGoal = async () => {
    if (!allowManagement) return;
    setLoading(true);
    
    try {
      // Stop goal logic would go here
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Goal stopped",
        description: `${goal.name} has been stopped`,
      });
      
      if (onUpdate) onUpdate();
      setShowStopDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendGoal = async () => {
    if (!allowManagement) return;
    setLoading(true);
    
    try {
      // Extend goal logic would go here
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Goal extended",
        description: `${goal.name} target has been increased by ${additionalTarget} ${goal.metricUnit}`,
      });
      
      if (onUpdate) onUpdate();
      setShowExtendDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
              <span className="ml-1 capitalize">{goalInstance.status}</span>
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
              <span className="font-medium">{Math.round(goalInstance.progress)}%</span>
            </div>
            {loading ? (
              <div className="h-2 w-full bg-gray-100 rounded overflow-hidden">
                <div className="h-full bg-gray-300 animate-pulse"></div>
              </div>
            ) : (
              <Progress value={goalInstance.progress} className="h-2" />
            )}
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Target</span>
            <span>
              {loading ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse"></span>
              ) : (
                <span>
                  {goalInstance.currentValue} / {goalInstance.targetValue}
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
          
          {employee && (
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium">Assigned to: </span>
              <span className="ml-1">{employee.name}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-4">
        {allowManagement && isCompleted && (
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 mr-2"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-4 w-4 mr-1" /> 
              Edit Target
            </Button>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Target Value</DialogTitle>
                  <DialogDescription>
                    Update the target value for this goal.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="target" className="text-right">
                      Target Value
                    </Label>
                    <Input
                      id="target"
                      type="number"
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(Number(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button onClick={handleUpdateTarget} disabled={loading}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm"
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" /> 
                  Extend Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Extend Goal Target</DialogTitle>
                  <DialogDescription>
                    This goal is already completed. You can extend it by adding to the target value.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currentTarget" className="text-right">
                      Current Target
                    </Label>
                    <Input
                      id="currentTarget"
                      type="number"
                      value={goalInstance.targetValue}
                      disabled
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="additionalTarget" className="text-right">
                      Additional Target
                    </Label>
                    <Input
                      id="additionalTarget"
                      type="number"
                      value={additionalTarget}
                      onChange={(e) => setAdditionalTarget(Number(e.target.value))}
                      className="col-span-3"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newTotal" className="text-right">
                      New Total
                    </Label>
                    <Input
                      id="newTotal"
                      type="number"
                      value={goalInstance.targetValue + additionalTarget}
                      disabled
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowExtendDialog(false)}>Cancel</Button>
                  <Button onClick={handleExtendGoal} disabled={loading || additionalTarget <= 0}>
                    Extend Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        {allowManagement && !isCompleted && (
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 mr-2"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-4 w-4 mr-1" /> 
              Edit
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 mr-2"
              onClick={() => setShowStopDialog(true)}
            >
              <StopCircle className="h-4 w-4 mr-1" /> 
              Stop
            </Button>
            
            <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stop Goal</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to stop tracking this goal? This action can't be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStopDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleStopGoal} disabled={loading}>
                    Stop Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> 
              Delete
            </Button>
            
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Goal</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this goal? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteGoal} disabled={loading}>
                    Delete Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        {!allowManagement && (
          <Button 
            variant="default" 
            className="w-full" 
          >
            View {isSpecialGoal ? "Details" : "& Update Progress"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GoalCard;
