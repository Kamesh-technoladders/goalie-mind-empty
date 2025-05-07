import { supabase } from "@/integrations/supabase/client";
import { GoalInstance, GoalWithDetails, Employee, GoalStatistics, AssignedGoal } from "@/types/goal";

/**
 * Fetches all goals with their details, including assignments, instances, and assigned employees
 */
export const getGoalsWithDetails = async (): Promise<GoalWithDetails[]> => {
  try {
    // Fetch all goals
    const { data: goals, error } = await supabase
      .from('hr_goals')
      .select(`
        *,
        instances: hr_goal_instances(
          *,
          assigned_goal: hr_assigned_goals(
            *,
            employee: hr_employees(id, first_name, last_name, email)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process the goals to include assignments and employees
    const processed = await Promise.all(goals.map(async (goal) => {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('hr_assigned_goals')
        .select(`
          *,
          employee:hr_employees(id, first_name, last_name, email, position)
        `)
        .eq('goal_id', goal.id);

      if (assignmentsError) throw assignmentsError;

      // Get all unique employees assigned to this goal
      const assignedEmployees = assignments
        .map(assignment => assignment.employee)
        .filter((employee): employee is Employee => Boolean(employee));

      // Calculate overall goal progress based on all assignments
      const totalTargetValue = assignments.reduce((sum, a) => sum + a.target_value, 0);
      const totalCurrentValue = assignments.reduce((sum, a) => sum + (a.current_value || 0), 0);
      const overallProgress = totalTargetValue > 0 
        ? Math.min(Math.round((totalCurrentValue / totalTargetValue) * 100), 100)
        : 0;

      return {
        ...goal,
        assignments,
        assignedTo: assignedEmployees,
        totalTargetValue,
        totalCurrentValue,
        overallProgress,
      } as GoalWithDetails;
    }));

    return processed;
  } catch (error) {
    console.error("Error getting goals with details:", error);
    throw error;
  }
};

/**
 * Fetches goal details for a specific goal ID
 */
export const getGoalDetails = async (goalId: string): Promise<GoalWithDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('hr_goals')
      .select(`
        *,
        instances: hr_goal_instances(
          *,
          assigned_goal: hr_assigned_goals(
            *,
            employee: hr_employees(id, first_name, last_name, email)
          )
        )
      `)
      .eq('id', goalId)
      .single();

    if (error) throw error;

    const { data: assignments, error: assignmentsError } = await supabase
      .from('hr_assigned_goals')
      .select(`
        *,
        employee:hr_employees(id, first_name, last_name, email, position)
      `)
      .eq('goal_id', goalId);

    if (assignmentsError) throw assignmentsError;

    // Get all unique employees assigned to this goal
    const assignedEmployees = assignments
      .map(assignment => assignment.employee)
      .filter((employee): employee is Employee => Boolean(employee));

    // Calculate overall goal progress
    const totalTargetValue = assignments.reduce((sum, a) => sum + a.target_value, 0);
    const totalCurrentValue = assignments.reduce((sum, a) => sum + (a.current_value || 0), 0);
    const overallProgress = totalTargetValue > 0 
      ? Math.min(Math.round((totalCurrentValue / totalTargetValue) * 100), 100)
      : 0;

    return {
      ...data,
      assignments,
      assignedTo: assignedEmployees,
      totalTargetValue,
      totalCurrentValue,
      overallProgress,
    };
  } catch (error) {
    console.error("Error getting goal details:", error);
    return null;
  }
};

/**
 * Updates the target value for a specific employee's goal
 */
export const updateEmployeeGoalTarget = async (
  assignedGoalId: string,
  newTargetValue: number
): Promise<AssignedGoal | null> => {
  try {
    const { data, error } = await supabase
      .from('hr_assigned_goals')
      .update({
        target_value: newTargetValue,
        updated_at: new Date(),
      })
      .eq('id', assignedGoalId)
      .select('*, employee:hr_employees(id, first_name, last_name, email)')
      .single();

    if (error) throw error;

    // Update all future instances for this assigned goal
    const { error: instanceError } = await supabase
      .from('hr_goal_instances')
      .update({
        target_value: newTargetValue,
        updated_at: new Date(),
      })
      .eq('assigned_goal_id', assignedGoalId)
      .gte('period_start', new Date().toISOString());

    if (instanceError) throw instanceError;

    return data;
  } catch (error) {
    console.error("Error updating employee goal target:", error);
    return null;
  }
};

/**
 * Extends the target value for a specific employee's goal
 */
export const extendEmployeeGoalTarget = async (
  assignedGoalId: string,
  additionalTargetValue: number
): Promise<AssignedGoal | null> => {
  try {
    // Get current target value
    const { data: currentAssignedGoal, error: fetchError } = await supabase
      .from('hr_assigned_goals')
      .select('*')
      .eq('id', assignedGoalId)
      .single();

    if (fetchError) throw fetchError;

    const newTargetValue = (currentAssignedGoal.target_value || 0) + additionalTargetValue;

    // Update the assigned goal with new target value
    const { data, error } = await supabase
      .from('hr_assigned_goals')
      .update({
        target_value: newTargetValue,
        status: 'in-progress', // Reset to in-progress when extending
        updated_at: new Date(),
      })
      .eq('id', assignedGoalId)
      .select('*, employee:hr_employees(id, first_name, last_name, email)')
      .single();

    if (error) throw error;

    // Get current instance
    const { data: currentInstance, error: instanceFetchError } = await supabase
      .from('hr_goal_instances')
      .select('*')
      .eq('assigned_goal_id', assignedGoalId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (instanceFetchError) throw instanceFetchError;

    // Update the current instance with new target value
    const { error: instanceUpdateError } = await supabase
      .from('hr_goal_instances')
      .update({
        target_value: newTargetValue,
        status: 'in-progress', // Reset to in-progress
        updated_at: new Date(),
      })
      .eq('id', currentInstance.id);

    if (instanceUpdateError) throw instanceUpdateError;

    return data;
  } catch (error) {
    console.error("Error extending employee goal target:", error);
    return null;
  }
};

/**
 * Removes an employee from a goal
 */
export const removeEmployeeFromGoal = async (
  assignedGoalId: string
): Promise<boolean> => {
  try {
    // First, delete all goal instances
    const { error: instancesError } = await supabase
      .from('hr_goal_instances')
      .delete()
      .eq('assigned_goal_id', assignedGoalId);

    if (instancesError) throw instancesError;

    // Then delete the assigned goal
    const { error } = await supabase
      .from('hr_assigned_goals')
      .delete()
      .eq('id', assignedGoalId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error removing employee from goal:", error);
    return false;
  }
};

/**
 * Adds employees to an existing goal
 */
export const addEmployeesToGoal = async (
  goalId: string,
  employees: { employeeId: string; targetValue: number }[],
  goalType: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
): Promise<boolean> => {
  try {
    // Insert assigned goals for each employee
    for (const employee of employees) {
      const { error } = await supabase
        .from('hr_assigned_goals')
        .insert({
          goal_id: goalId,
          employee_id: employee.employeeId,
          target_value: employee.targetValue,
          current_value: 0,
          progress: 0,
          status: 'pending',
          goal_type: goalType,
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error("Error adding employees to goal:", error);
    return false;
  }
};

/**
 * Calculates goal statistics
 */
export const calculateGoalStatistics = (goals: GoalWithDetails[]): GoalStatistics => {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => 
    goal.assignments?.every(a => a.status === "completed")
  ).length;
  
  const inProgressGoals = goals.filter(goal => 
    goal.assignments?.some(a => a.status === "in-progress")
  ).length;
  
  const overdueGoals = goals.filter(goal => 
    goal.assignments?.some(a => a.status === "overdue")
  ).length;
  
  const pendingGoals = goals.filter(goal => 
    goal.assignments?.every(a => a.status === "pending")
  ).length;
  
  const completionRate = totalGoals > 0 
    ? Math.round((completedGoals / totalGoals) * 100) 
    : 0;

  return {
    totalGoals,
    completedGoals,
    inProgressGoals,
    overdueGoals,
    pendingGoals,
    completionRate
  };
};

/**
 * Fetches available employees that can be assigned to goals
 */
export const getAvailableEmployees = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('hr_employees')
      .select('id, first_name, last_name, email, position, department:hr_departments(name)')
      .eq('employment_status', 'active')
      .order('first_name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching available employees:", error);
    return [];
  }
};

/**
 * Re-export the deleteGoal function from supabaseData
 */
export { deleteGoal } from '@/lib/supabaseData';

/**
 * Forces an update of the Submission and Onboarding goals calculation
 */
export const updateSpecialGoals = async (): Promise<boolean> => {
  const { updateSpecialGoals } = await import('@/lib/supabaseData');
  return updateSpecialGoals();
};

/**
 * Updates a specific special goal (Submission or Onboarding)
 */
export const updateSpecificSpecialGoal = async (goalId: string): Promise<boolean> => {
  const { updateSpecificSpecialGoal } = await import('@/lib/supabaseData');
  return updateSpecificSpecialGoal(goalId);
};
