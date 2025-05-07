
import { supabase } from "@/integrations/supabase/client";
import { GoalInstance } from "@/types/goal";

/**
 * Updates the target value of a goal instance.
 * This is also used to override the target value of a goal.
 */
export const updateGoalTarget = async (
  goalInstanceId: string,
  newTargetValue: number
): Promise<GoalInstance | null> => {
  try {
    const { data, error } = await supabase
      .from('hr_goal_instances')
      .update({
        target_value: newTargetValue,
        updated_at: new Date(),
      })
      .eq('id', goalInstanceId)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating goal target:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception updating goal target:", error);
    return null;
  }
};

/**
 * Extends the target value of a goal instance for a completed goal.
 */
export const extendGoalTarget = async (
  goalInstanceId: string,
  additionalTargetValue: number
): Promise<GoalInstance | null> => {
  try {
    // Get current target value
    const { data: currentInstance, error: fetchError } = await supabase
      .from('hr_goal_instances')
      .select('*')
      .eq('id', goalInstanceId)
      .single();

    if (fetchError) {
      console.error("Error fetching goal instance:", fetchError);
      return null;
    }

    const newTargetValue = (currentInstance.target_value || 0) + additionalTargetValue;

    // Update the target value
    const { data, error } = await supabase
      .from('hr_goal_instances')
      .update({
        target_value: newTargetValue,
        status: 'in-progress', // Reset to in-progress
        updated_at: new Date(),
      })
      .eq('id', goalInstanceId)
      .select('*')
      .single();

    if (error) {
      console.error("Error extending goal target:", error);
      return null;
    }

    // Also update the assigned goal
    const { error: updateError } = await supabase
      .from('hr_assigned_goals')
      .update({
        target_value: newTargetValue,
        status: 'in-progress',
        updated_at: new Date(),
      })
      .eq('id', data.assigned_goal_id);

    if (updateError) {
      console.error("Error updating assigned goal:", updateError);
    }

    return data;
  } catch (error) {
    console.error("Exception extending goal target:", error);
    return null;
  }
};

/**
 * Stops tracking a goal instance.
 */
export const stopGoal = async (
  goalInstanceId: string
): Promise<GoalInstance | null> => {
  try {
    const { data, error } = await supabase
      .from('hr_goal_instances')
      .update({
        status: 'stopped',
        updated_at: new Date(),
      })
      .eq('id', goalInstanceId)
      .select('*')
      .single();

    if (error) {
      console.error("Error stopping goal:", error);
      return null;
    }

    // Also update the assigned goal
    const { error: updateError } = await supabase
      .from('hr_assigned_goals')
      .update({
        status: 'stopped',
        updated_at: new Date(),
      })
      .eq('id', data.assigned_goal_id);

    if (updateError) {
      console.error("Error updating assigned goal:", updateError);
    }

    return data;
  } catch (error) {
    console.error("Exception stopping goal:", error);
    return null;
  }
};

/**
 * Permanently deletes a goal and all associated data
 */
export const deleteGoal = async (
  goalId: string
): Promise<boolean> => {
  try {
    // First, get all the assigned goals that are associated with this goal
    const { data: assignedGoals, error: fetchError } = await supabase
      .from('hr_assigned_goals')
      .select('id')
      .eq('goal_id', goalId);

    if (fetchError) {
      console.error("Error fetching assigned goals:", fetchError);
      return false;
    }

    // For each assigned goal, delete its goal instances
    if (assignedGoals && assignedGoals.length > 0) {
      const assignedGoalIds = assignedGoals.map(ag => ag.id);

      const { error: instancesError } = await supabase
        .from('hr_goal_instances')
        .delete()
        .in('assigned_goal_id', assignedGoalIds);

      if (instancesError) {
        console.error("Error deleting goal instances:", instancesError);
        return false;
      }

      // Delete all assigned goals
      const { error: assignedError } = await supabase
        .from('hr_assigned_goals')
        .delete()
        .in('id', assignedGoalIds);

      if (assignedError) {
        console.error("Error deleting assigned goals:", assignedError);
        return false;
      }
    }

    // Finally, delete the goal itself
    const { error } = await supabase
      .from('hr_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error("Error deleting goal:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception deleting goal:", error);
    return false;
  }
};

/**
 * Creates a new goal with the specified details
 */
export const createGoal = async (goalData: {
  name: string;
  description: string;
  sector: string;
  targetValue: number;
  metricType: string;
  metricUnit: string;
  startDate: string;
  endDate: string;
}): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('hr_goals')
      .insert([
        {
          name: goalData.name,
          description: goalData.description,
          sector: goalData.sector,
          target_value: goalData.targetValue,
          metric_type: goalData.metricType,
          metric_unit: goalData.metricUnit,
          start_date: goalData.startDate,
          end_date: goalData.endDate,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Error creating goal:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Exception creating goal:", error);
    return null;
  }
};

/**
 * Forces an update of the Submission and Onboarding goals calculation
 */
export const updateSpecialGoals = async (): Promise<boolean> => {
  try {
    // Call the RPC function to update special goals
    const { error } = await supabase.rpc('update_special_goal_values');
    
    if (error) {
      console.error("Error updating special goals:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating special goals:", error);
    return false;
  }
};

/**
 * Updates a specific special goal (Submission or Onboarding)
 */
export const updateSpecificSpecialGoal = async (goalId: string): Promise<boolean> => {
  try {
    // Call the RPC function to update a specific special goal
    const { data, error } = await supabase.rpc('update_specific_special_goal', { goal_id: goalId });
    
    if (error) {
      console.error("Error updating specific special goal:", error);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error("Exception updating specific special goal:", error);
    return false;
  }
};
