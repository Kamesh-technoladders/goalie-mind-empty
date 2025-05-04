
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { 
  updateEmployeeGoalTarget,
  extendEmployeeGoalTarget,
  removeEmployeeFromGoal,
  deleteGoal as deleteGoalService,
} from '@/lib/goalService';
import { useQueryClient } from '@tanstack/react-query';
import { GoalInstance, GoalWithDetails, AssignedGoal } from '@/types/goal';

export const useGoalManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteGoal = async (
    goalId: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const result = await deleteGoalService(goalId);
      
      if (result) {
        toast({
          title: "Goal deleted",
          description: "The goal has been permanently removed.",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["employeeGoals"] });
        queryClient.invalidateQueries({ queryKey: ["goalDetails"] });
        
        return true;
      } else {
        toast({
          title: "Deletion failed",
          description: "Could not delete the goal. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployeeGoalTarget = async (
    assignedGoalId: string,
    newTargetValue: number
  ): Promise<AssignedGoal | null> => {
    setIsLoading(true);

    try {
      const result = await updateEmployeeGoalTarget(assignedGoalId, newTargetValue);
      
      if (result) {
        toast({
          title: "Target updated",
          description: `Employee's goal target updated to ${newTargetValue}`,
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["employeeGoals"] });
        queryClient.invalidateQueries({ queryKey: ["goalDetails"] });
        
        return result;
      } else {
        toast({
          title: "Update failed",
          description: "Could not update the employee's target value. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error updating employee goal target:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendEmployeeGoal = async (
    assignedGoalId: string,
    additionalTarget: number
  ): Promise<AssignedGoal | null> => {
    setIsLoading(true);

    try {
      const result = await extendEmployeeGoalTarget(assignedGoalId, additionalTarget);
      
      if (result) {
        toast({
          title: "Goal extended",
          description: `Employee's goal target increased by ${additionalTarget}`,
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["employeeGoals"] });
        queryClient.invalidateQueries({ queryKey: ["goalDetails"] });
        
        return result;
      } else {
        toast({
          title: "Extension failed",
          description: "Could not extend the employee's goal target. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error extending employee goal:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmployeeFromGoal = async (
    assignedGoalId: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const result = await removeEmployeeFromGoal(assignedGoalId);
      
      if (result) {
        toast({
          title: "Employee removed",
          description: "The employee has been removed from this goal.",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["employeeGoals"] });
        queryClient.invalidateQueries({ queryKey: ["goalDetails"] });
        
        return true;
      } else {
        toast({
          title: "Removal failed",
          description: "Could not remove the employee from the goal. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error removing employee from goal:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleDeleteGoal,
    handleUpdateEmployeeGoalTarget,
    handleExtendEmployeeGoal,
    handleRemoveEmployeeFromGoal
  };
};

export default useGoalManagement;
