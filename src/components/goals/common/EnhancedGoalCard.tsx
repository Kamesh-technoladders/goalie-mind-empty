
import React, { useState, useEffect } from "react";
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
  Trash2,
  History,
  TrendingUp
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
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getGoalDetails } from "@/lib/goalService";

interface EmployeeGoalCardProps {
  goal?: GoalWithDetails;
  goalId?: string;
  onUpdate?: () => void;
  showAllGoals?: boolean;
}

const EnhancedGoalCard: React.FC<EmployeeGoalCardProps> = ({ 
  goal: initialGoal, 
  goalId,
  onUpdate,
  showAllGoals = true
}) => {
  const { toast } = useToast();
  const { 
    isLoading: managementLoading,
    handleDeleteGoal,
  } = useGoalManagement();

  const [goal, setGoal] = useState<GoalWithDetails | undefined>(initialGoal);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("current");
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmployeeManagementOpen, setIsEmployeeManagementOpen] = useState(false);
  const [selectedAssignedGoal, setSelectedAssignedGoal] = useState<AssignedGoal | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [newTargetValue, setNewTargetValue] = useState(0);
  const [additionalTargetValue, setAdditionalTargetValue] = useState(0);

  // Fetch goal data if goalId is provided
  useEffect(() => {
    if (goalId && !initialGoal) {
      const fetchGoal = async () => {
        setIsLoading(true);
        try {
          const goalData = await getGoalDetails(goalId);
          if (goalData) {
            setGoal(goalData);
          } else {
            toast({
              title: "Error",
              description: "Could not fetch goal details",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching goal:", error);
          toast({
            title: "Error",
            description: "An unexpected error occurred while fetching goal details",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchGoal();
    }
  }, [goalId, initialGoal, toast]);

  // Helper function to group instances by status
  const getGoalInstances = () => {
    if (!goal?.assignments) return { active: [], history: [], upcoming: [] };

    // Get all instances across all assignments
    const allInstances: GoalInstance[] = [];
    goal.assignments.forEach(assignment => {
      const instances = goal.instances?.filter(
        instance => instance.assigned_goal_id === assignment.id
      ) || [];
      allInstances.push(...instances);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort instances by period_start in descending order (newest first)
    const sortedInstances = [...allInstances].sort((a, b) => {
      return new Date(b.period_start).getTime() - new Date(a.period_start).getTime();
    });

    // Group instances by their status relative to current date
    const active = sortedInstances.filter(instance => {
      const start = new Date(instance.period_start);
      const end = new Date(instance.period_end);
      return start <= today && end >= today;
    });

    const history = sortedInstances.filter(instance => {
      const end = new Date(instance.period_end);
      return end < today;
    });

    const upcoming = sortedInstances.filter(instance => {
      const start = new Date(instance.period_start);
      return start > today;
    });

    return { active, history, upcoming };
  };

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
    if (!goal) return;
    
    const result = await handleDeleteGoal(goal.id);
    if (result) {
      setIsDeleteDialogOpen(false);
      if (onUpdate) onUpdate();
    }
  };

  const handleUpdateTargetClick = async () => {
    if (!selectedAssignedGoal || newTargetValue <= 0) return;
    
    try {
      // Use the function from your hook
      const result = await useGoalManagement().handleUpdateEmployeeGoalTarget(
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
      // Use the function from your hook
      const result = await useGoalManagement().handleExtendEmployeeGoal(
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
      // Use the function from your hook
      const result = await useGoalManagement().handleRemoveEmployeeFromGoal(assignedGoalId);
      
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

  // Display loading state if needed
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading goal data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display error state if no goal data
  if (!goal) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Goal not found</h3>
            <p className="text-sm text-gray-500">This goal might have been deleted or no longer exists</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group instances by status
  const { active, history, upcoming } = getGoalInstances();
  const hasHistoricalData = history.length > 0;
  const hasUpcomingData = upcoming.length > 0;

  const getCurrentActivePeriod = () => {
    if (active.length === 0) return "No active period";
    
    // Find the active instance for the goal type
    const instance = active[0];
    return `${formatDate(instance.period_start)} - ${formatDate(instance.period_end)}`;
  };

  // Determine the goal timeframe type from assignments
  const getGoalTimeframe = () => {
    if (!goal.assignments || goal.assignments.length === 0) return "Unknown";
    return goal.assignments[0].goalType || "Unknown";
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold mb-1">{goal.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  {goal.sector}
                </Badge>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {getGoalTimeframe()}
                </Badge>
              </div>
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
          <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="current" className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Current Period
              </TabsTrigger>
              {hasHistoricalData && (
                <TabsTrigger value="history" className="flex-1">
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              )}
              {hasUpcomingData && (
                <TabsTrigger value="upcoming" className="flex-1">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upcoming
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="current" className="mt-0">
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
                    <span>{getCurrentActivePeriod()}</span>
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
                              
                              // Find active instance for this employee
                              const employeeActiveInstance = active.find(
                                instance => instance.assigned_goal_id === assignment.id
                              );
                              
                              // Use instance values if available, otherwise use assignment values
                              const currentValue = employeeActiveInstance?.current_value ?? assignment.current_value;
                              const targetValue = employeeActiveInstance?.target_value ?? assignment.target_value;
                              const status = employeeActiveInstance?.status ?? assignment.status;
                              const progress = employeeActiveInstance?.progress ?? assignment.progress;
                              
                              return (
                                <div key={assignment.id} className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-50">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {employee.first_name} {employee.last_name}
                                    </span>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <Target className="h-3 w-3 mr-1" />
                                      <span>
                                        {currentValue} / {targetValue} {goal.metricUnit}
                                      </span>
                                      <Badge 
                                        variant="outline"
                                        className={`${getStatusColor(status)} ml-2 text-xs px-1 py-0`}
                                      >
                                        {status}
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
                                          setNewTargetValue(targetValue);
                                          setIsUpdateDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Target
                                      </DropdownMenuItem>
                                      
                                      {status === "completed" && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedAssignedGoal(assignment);
                                            setAdditionalTargetValue(Math.round(targetValue * 0.1)); // Default 10% more
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
            </TabsContent>

            {hasHistoricalData && (
              <TabsContent value="history" className="mt-0 space-y-4">
                <div className="text-sm font-medium">Historical Performance</div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {history.map((instance) => {
                      // Find the assigned goal for this instance
                      const assignment = goal.assignments?.find(a => a.id === instance.assigned_goal_id);
                      if (!assignment) return null;

                      const employee = assignment.employee;
                      if (!employee) return null;

                      return (
                        <div key={instance.id} className="border rounded-md p-2 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </span>
                            <Badge 
                              variant="outline"
                              className={`${getStatusColor(instance.status)} text-xs`}
                            >
                              {instance.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(instance.period_start)} - {formatDate(instance.period_end)}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            Progress: {instance.current_value} / {instance.target_value} {goal.metricUnit} ({instance.progress}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {hasUpcomingData && (
              <TabsContent value="upcoming" className="mt-0 space-y-4">
                <div className="text-sm font-medium">Upcoming Periods</div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {upcoming.map((instance) => {
                      // Find the assigned goal for this instance
                      const assignment = goal.assignments?.find(a => a.id === instance.assigned_goal_id);
                      if (!assignment) return null;

                      const employee = assignment.employee;
                      if (!employee) return null;

                      return (
                        <div key={instance.id} className="border rounded-md p-2 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </span>
                            <Badge 
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
                            >
                              Upcoming
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(instance.period_start)} - {formatDate(instance.period_end)}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            Target: {instance.target_value} {goal.metricUnit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
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
            <Button onClick={handleUpdateTargetClick} disabled={managementLoading || newTargetValue <= 0}>
              {managementLoading ? "Updating..." : "Update Target"}
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
            <Button onClick={handleExtendGoalClick} disabled={managementLoading || additionalTargetValue <= 0}>
              {managementLoading ? "Extending..." : "Extend Target"}
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
              {managementLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnhancedGoalCard;
