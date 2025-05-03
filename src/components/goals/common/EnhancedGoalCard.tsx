
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  MoreHorizontal, 
  User, 
  Users,
  UserPlus,
  UserMinus,
  Edit,
  Trash2
} from "lucide-react";
import { GoalInstance, GoalWithDetails, AssignedGoal } from "@/types/goal";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoalManagement } from "@/hooks/useGoalManagement";
import { format } from "date-fns";
import { 
  updateEmployeeGoalTarget, 
  extendEmployeeGoalTarget, 
  removeEmployeeFromGoal
} from "@/lib/goalService";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeGoalCardProps {
  goal: GoalWithDetails;
  onUpdate?: () => void;
  showAllGoals?: boolean;
}

const EnhancedGoalCard: React.FC<EmployeeGoalCardProps> = ({ 
  goal, 
  onUpdate,
  showAllGoals = true
}) => {
  const { toast } = useToast();
  const { 
    isLoading,
    handleDeleteGoal,
  } = useGoalManagement();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmployeeManagementOpen, setIsEmployeeManagementOpen] = useState(false);
  const [selectedAssignedGoal, setSelectedAssignedGoal] = useState<AssignedGoal | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [newTargetValue, setNewTargetValue] = useState(0);
  const [additionalTargetValue, setAdditionalTargetValue] = useState(0);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (e) {
      console.error("Invalid date:", dateStr);
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "stopped":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const handleDeleteClick = async () => {
    const result = await handleDeleteGoal(goal.id);
    if (result) {
      setIsDeleteDialogOpen(false);
      if (onUpdate) onUpdate();
    }
  };

  const handleUpdateTargetClick = async () => {
    if (!selectedAssignedGoal || newTargetValue <= 0) return;
    
    try {
      const result = await updateEmployeeGoalTarget(
        selectedAssignedGoal.id,
        newTargetValue
      );
      
      if (result) {
        toast({
          title: "Target updated",
          description: `Goal target updated to ${newTargetValue}`,
        });
        setIsUpdateDialogOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast({
          title: "Update failed",
          description: "Could not update the target value. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating target:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleExtendGoalClick = async () => {
    if (!selectedAssignedGoal || additionalTargetValue <= 0) return;
    
    try {
      const result = await extendEmployeeGoalTarget(
        selectedAssignedGoal.id,
        additionalTargetValue
      );
      
      if (result) {
        toast({
          title: "Goal extended",
          description: `Goal target increased by ${additionalTargetValue}`,
        });
        setIsExtendDialogOpen(false);
        if (onUpdate) onUpdate();
      } else {
        toast({
          title: "Extension failed",
          description: "Could not extend the goal target. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error extending goal:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveEmployeeFromGoal = async (assignedGoalId: string) => {
    try {
      const result = await removeEmployeeFromGoal(assignedGoalId);
      
      if (result) {
        toast({
          title: "Employee removed",
          description: "Employee has been removed from this goal.",
        });
        
        if (onUpdate) onUpdate();
      } else {
        toast({
          title: "Removal failed",
          description: "Could not remove the employee. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold mb-1">{goal.name}</CardTitle>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 mb-2">
                {goal.sector}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Goal Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsEmployeeManagementOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Employees
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">{goal.description}</div>
            
            <div>
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <span>Overall Progress</span>
                <span>{goal.overallProgress ?? 0}%</span>
              </div>
              <Progress value={goal.overallProgress ?? 0} className="h-2" />
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center text-gray-500">
                <Target className="h-4 w-4 mr-1 text-gray-400" />
                <span>
                  {goal.totalCurrentValue ?? 0} / {goal.totalTargetValue ?? 0} {goal.metricUnit}
                </span>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(goal.startDate)} - {formatDate(goal.endDate)}</span>
              </div>
            </div>

            {goal.assignedTo && goal.assignedTo.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="employees">
                  <AccordionTrigger className="text-sm py-2">
                    <span className="flex items-center">
                      {goal.assignedTo.length === 1 ? (
                        <User className="h-3 w-3 mr-1" />
                      ) : (
                        <Users className="h-3 w-3 mr-1" />
                      )}
                      <span>{goal.assignedTo.length} {goal.assignedTo.length === 1 ? 'employee' : 'employees'}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="max-h-48">
                      <div className="space-y-2">
                        {goal.assignments?.map((assignment) => {
                          const employee = assignment.employee;
                          if (!employee) return null;
                          
                          return (
                            <div key={assignment.id} className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {employee.first_name} {employee.last_name}
                                </span>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Target className="h-3 w-3 mr-1" />
                                  <span>
                                    {assignment.current_value} / {assignment.target_value} {goal.metricUnit}
                                  </span>
                                  <Badge 
                                    variant="outline"
                                    className={`${getStatusColor(assignment.status)} ml-2 text-xs px-1 py-0`}
                                  >
                                    {assignment.status}
                                  </Badge>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAssignedGoal(assignment);
                                      setNewTargetValue(assignment.target_value);
                                      setIsUpdateDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Target
                                  </DropdownMenuItem>
                                  
                                  {assignment.status === "completed" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedAssignedGoal(assignment);
                                        setAdditionalTargetValue(Math.round(assignment.target_value * 0.1)); // Default 10% more
                                        setIsExtendDialogOpen(true);
                                      }}
                                    >
                                      <Target className="h-4 w-4 mr-2" />
                                      Extend Goal
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveEmployeeFromGoal(assignment.id)}
                                    className="text-red-600"
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove Employee
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Update Target Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Target Value</DialogTitle>
            <DialogDescription>
              {selectedAssignedGoal?.employee && (
                <span>
                  Update the target value for {selectedAssignedGoal.employee.first_name} {selectedAssignedGoal.employee.last_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">New Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                min="1"
                value={newTargetValue}
                onChange={(e) => setNewTargetValue(Number(e.target.value))}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              Current progress: {selectedAssignedGoal?.current_value} / {selectedAssignedGoal?.target_value}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTargetClick} disabled={isLoading || newTargetValue <= 0}>
              {isLoading ? "Updating..." : "Update Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Extend Target Dialog */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Goal Target</DialogTitle>
            <DialogDescription>
              {selectedAssignedGoal?.employee && (
                <span>
                  Add additional target value for {selectedAssignedGoal.employee.first_name} {selectedAssignedGoal.employee.last_name}'s completed goal.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="additionalValue">Additional Target Value</Label>
              <Input
                id="additionalValue"
                type="number"
                min="1"
                value={additionalTargetValue}
                onChange={(e) => setAdditionalTargetValue(Number(e.target.value))}
              />
            </div>
            <div className="text-sm text-gray-500">
              Current target: {selectedAssignedGoal?.target_value} {goal.metricUnit}
            </div>
            <div className="text-sm font-medium">
              New target will be: {Number(selectedAssignedGoal?.target_value || 0) + additionalTargetValue} {goal.metricUnit}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendGoalClick} disabled={isLoading || additionalTargetValue <= 0}>
              {isLoading ? "Extending..." : "Extend Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Employee Management Dialog */}
      <Dialog open={isEmployeeManagementOpen} onOpenChange={setIsEmployeeManagementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Employees</DialogTitle>
            <DialogDescription>
              Add or remove employees from this goal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h4 className="text-sm font-medium mb-2">Assigned Employees</h4>
            <ScrollArea className="h-64 border rounded-md p-2">
              {goal.assignments && goal.assignments.length > 0 ? (
                <div className="space-y-2">
                  {goal.assignments.map(assignment => {
                    const employee = assignment.employee;
                    if (!employee) return null;
                    
                    return (
                      <div key={assignment.id} className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50">
                        <div>
                          <div className="font-medium text-sm">{employee.first_name} {employee.last_name}</div>
                          <div className="text-xs text-gray-500">{employee.position || 'No position'}</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveEmployeeFromGoal(assignment.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No employees assigned to this goal
                </div>
              )}
            </ScrollArea>
            
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEmployeeManagementOpen(false);
                  // Here you would navigate to employee assignment page or open a modal
                  toast({
                    title: "Employee Assignment",
                    description: "Use the 'Assign Goals' button on the main page to add employees to this goal."
                  });
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign New Employees
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this goal and all its tracking data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClick} className="bg-red-600 hover:bg-red-700">
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnhancedGoalCard;
