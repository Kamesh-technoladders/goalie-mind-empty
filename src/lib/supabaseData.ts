import { supabase } from "@/integrations/supabase/client";
import { Employee, Goal, AssignedGoal, GoalWithDetails, KPI, TrackingRecord, GoalType, GoalInstance, EmployeeGoalTarget } from "@/types/goal";
import { format } from 'date-fns';

// Type definitions for database tables
type HrEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  email: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
};

type HrGoal = {
  id: string;
  name: string;
  description: string;
  sector: string;
  target_value: number;
  metric_type: string;
  metric_unit: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

type HrKpi = {
  id: string;
  goal_id: string;
  name: string;
  weight: number;
  current_value: number;
  target_value: number;
  metric_type: string;
  metric_unit: string;
  created_at: string;
  updated_at: string;
};

type HrAssignedGoal = {
  id: string;
  goal_id: string;
  employee_id: string;
  status: string;
  progress: number;
  current_value: number;
  target_value: number;
  notes?: string;
  assigned_at: string;
  updated_at: string;
  goal_type: string;
};

type TrackingRecordDb = {
  id: string;
  assigned_goal_id: string;
  record_date: string;
  value: number;
  notes?: string;
  created_at: string;
};

// Helper functions to convert between API and database formats
const mapHrEmployeeToEmployee = (hrEmployee: HrEmployee): Employee => ({
  id: hrEmployee.id,
  name: `${hrEmployee.first_name} ${hrEmployee.last_name}`,
  position: hrEmployee.position,
  department: hrEmployee.department as any,
  email: hrEmployee.email,
  avatar: hrEmployee.profile_picture_url
});

const mapHrGoalToGoal = (hrGoal: HrGoal, kpis?: KPI[]): Goal => ({
  id: hrGoal.id,
  name: hrGoal.name,
  description: hrGoal.description,
  sector: hrGoal.sector as any,
  targetValue: hrGoal.target_value,
  metricType: hrGoal.metric_type as any,
  metricUnit: hrGoal.metric_unit,
  startDate: hrGoal.start_date,
  endDate: hrGoal.end_date,
  kpis,
  createdAt: hrGoal.created_at
});

const mapHrKpiToKpi = (hrKpi: HrKpi): KPI => ({
  id: hrKpi.id,
  name: hrKpi.name,
  weight: hrKpi.weight,
  currentValue: hrKpi.current_value,
  targetValue: hrKpi.target_value,
  metricType: hrKpi.metric_type as any,
  metricUnit: hrKpi.metric_unit
});

const mapHrAssignedGoalToAssignedGoal = (hrAssignedGoal: HrAssignedGoal): AssignedGoal => ({
  id: hrAssignedGoal.id,
  goalId: hrAssignedGoal.goal_id,
  employeeId: hrAssignedGoal.employee_id,
  status: hrAssignedGoal.status as any,
  progress: hrAssignedGoal.progress,
  currentValue: hrAssignedGoal.current_value,
  targetValue: hrAssignedGoal.target_value,
  notes: hrAssignedGoal.notes,
  assignedAt: hrAssignedGoal.assigned_at,
  goalType: hrAssignedGoal.goal_type as GoalType,
});

const mapTrackingRecordDbToTrackingRecord = (record: TrackingRecordDb): TrackingRecord => ({
  id: record.id,
  assignedGoalId: record.assigned_goal_id,
  recordDate: record.record_date,
  value: record.value,
  notes: record.notes,
  createdAt: record.created_at,
});

// API functions to interact with Supabase
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('hr_employees')
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        hr_departments(name),
        hr_designations(name)
      `);

    if (error) {
      console.error('Error fetching employees:', error);
      return [];
    }

    return data.map((employee) => ({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email,
      avatar: employee.profile_picture_url,
      position: employee.hr_designations?.name ?? 'Unknown', // Extract designation
      department: employee.hr_departments?.name ?? 'Unknown', // Extract department
    }));
  } catch (error) {
    console.error('Error in getEmployees:', error);
    return [];
  }
};

export const getGoals = async (): Promise<Goal[]> => {
  try {
    const { data: goalsData, error: goalsError } = await supabase
      .from('hr_goals')
      .select('*');

    if (goalsError || !goalsData) {
      console.error('Error fetching goals:', goalsError);
      return []; // Always return an empty array
    }

    const goals: Goal[] = [];

    for (const hrGoal of goalsData) {
      const { data: kpisData, error: kpisError } = await supabase
        .from('hr_kpis')
        .select('*')
        .eq('goal_id', hrGoal.id);

      if (kpisError) {
        console.error(`Error fetching KPIs for goal ${hrGoal.id}:`, kpisError);
      }

      const kpis = kpisData ? kpisData.map(mapHrKpiToKpi) : [];
      goals.push(mapHrGoalToGoal(hrGoal, kpis));
    }

    return goals;
  } catch (error) {
    console.error('Error in getGoals:', error);
    return [];
  }
};

export const getAssignedGoals = async (): Promise<AssignedGoal[]> => {
  try {
    const { data, error } = await supabase
      .from('hr_assigned_goals')
      .select('*');
    
    if (error) {
      console.error('Error fetching assigned goals:', error);
      return [];
    }
    
    return data.map(mapHrAssignedGoalToAssignedGoal);
  } catch (error) {
    console.error('Error in getAssignedGoals:', error);
    return [];
  }
};

// New function to get count data for Submission and Onboarding goals
export const getSubmissionOrOnboardingCounts = async (
  employeeId: string,
  goalType: string,
  periodStart: string, 
  periodEnd: string
): Promise<number> => {
  try {
    // Determine the correct sub_status_id based on goal type
    const subStatusId = goalType === "Submission"
      ? "71706ff4-1bab-4065-9692-2a1237629dda"
      : "c9716374-3477-4606-877a-dfa5704e7680";
    
    // Extend the period end to include the entire day
    const periodEndPlusOne = new Date(periodEnd);
    periodEndPlusOne.setDate(periodEndPlusOne.getDate() + 1);
    const periodEndStr = periodEndPlusOne.toISOString().split('T')[0];
    
    console.log(`Fetching ${goalType} counts for employee ${employeeId} from ${periodStart} to ${periodEndStr}`);
    
    // Fetch count records from hr_status_change_counts
    const { data, error } = await supabase
      .from("hr_status_change_counts")
      .select("count")
      .eq("sub_status_id", subStatusId)
      .eq("candidate_owner", employeeId)
      .gte("created_at", periodStart)
      .lt("created_at", periodEndStr);
    
    if (error) {
      console.error(`Error fetching ${goalType} counts:`, error);
      return 0;
    }
    
    console.log(`Found ${data.length} ${goalType} count records:`, data);
    
    // Sum all the counts
    const totalCount = data.reduce((sum, record) => sum + record.count, 0);
    return totalCount;
  } catch (error) {
    console.error(`Error in getSubmissionOrOnboardingCounts:`, error);
    return 0;
  }
};

export const getGoalsWithDetails = async (): Promise<GoalWithDetails[]> => {
  try {
    const goals = await getGoals();
    const assignedGoals = await getAssignedGoals();
    const employees = await getEmployees();
    
    return goals.map(goal => {
      // Get all assignments for this goal
      const assignments = assignedGoals.filter(ag => ag.goalId === goal.id);
      
      // Get all employees assigned to this goal
      const assignedEmployees = assignments
        .map(a => employees.find(e => e.id === a.employeeId))
        .filter(Boolean) as Employee[];
      
      // Calculate total target and current values
      const totalTargetValue = assignments.reduce((sum, a) => sum + a.targetValue, 0);
      const totalCurrentValue = assignments.reduce((sum, a) => sum + a.currentValue, 0);
      
      // Calculate overall progress
      const overallProgress = totalTargetValue > 0 
        ? Math.min(Math.round((totalCurrentValue / totalTargetValue) * 100), 100)
        : 0;
      
      return {
        ...goal,
        assignedTo: assignedEmployees,
        assignments: assignments,
        totalTargetValue,
        totalCurrentValue,
        overallProgress
      };
    });
  } catch (error) {
    console.error('Error in getGoalsWithDetails:', error);
    return [];
  }
};

export const getSectorsWithCounts = async () => {
  try {
    const goals = await getGoals();
    
    const sectors = goals.reduce((acc, goal) => {
      acc[goal.sector] = (acc[goal.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(sectors).map(([name, count]) => ({ name, count }));
  } catch (error) {
    console.error('Error in getSectorsWithCounts:', error);
    return [];
  }
};

export const createEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase
      .from('hr_employees')
      .insert({
        name: employee.name,
        position: employee.position,
        department: employee.department,
        email: employee.email,
        avatar: employee.avatar
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating employee:', error);
      return null;
    }
    
    return mapHrEmployeeToEmployee(data);
  } catch (error) {
    console.error('Error in createEmployee:', error);
    return null;
  }
};

export const createGoal = async (
  goal: Omit<Partial<Goal>, 'id' | 'createdAt'>,
  kpis?: Omit<KPI, 'id'>[]
): Promise<Goal | null> => {
  try {
    const currentDate = new Date().toISOString();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3); // Set default end date to 3 months from now
    
    const { data: goalData, error: goalError } = await supabase
      .from('hr_goals')
      .insert({
        name: goal.name,
        description: goal.description,
        sector: goal.sector,
        target_value: goal.targetValue ?? 0,
        metric_type: goal.metricType,
        metric_unit: goal.metricUnit,
        start_date: goal.startDate ?? currentDate,
        end_date: goal.endDate ?? futureDate.toISOString()
      })
      .select()
      .single();
    
    if (goalError) {
      console.error('Error creating goal:', goalError);
      return null;
    }
    
    if (kpis && kpis.length > 0) {
      const kpisToInsert = kpis.map(kpi => ({
        goal_id: goalData.id,
        name: kpi.name,
        weight: kpi.weight,
        current_value: kpi.currentValue,
        target_value: kpi.targetValue,
        metric_type: kpi.metricType,
        metric_unit: kpi.metricUnit
      }));
      
      const { data: kpisData, error: kpisError } = await supabase
        .from('hr_kpis')
        .insert(kpisToInsert)
        .select();
      
      if (kpisError) {
        console.error('Error creating KPIs:', kpisError);
      }
      
      const mappedKpis = kpisData ? kpisData.map(mapHrKpiToKpi) : undefined;
      return mapHrGoalToGoal(goalData, mappedKpis);
    }
    
    return mapHrGoalToGoal(goalData);
  } catch (error) {
    console.error('Error in createGoal:', error);
    return null;
  }
};

export const assignGoalToEmployees = async (
  goalId: string,
  employeeIds: string[],
  goalType: GoalType,
  employeeTargets: EmployeeGoalTarget[]
) => {
  const { data: goal } = await supabase
    .from('hr_goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (!goal) {
    throw new Error('Goal not found');
  }

  // Create assigned goals for each employee
  const assignedGoalsPromises = employeeTargets.map(async ({ employee, targetValue }) => {
    const { data: assignedGoal, error: assignError } = await supabase
      .from('hr_assigned_goals')
      .insert({
        goal_id: goalId,
        employee_id: employee.id,
        target_value: targetValue,
        goal_type: goalType,
        current_value: 0,
        progress: 0,
        status: 'pending'
      })
      .select()
      .single();

    if (assignError) {
      throw new Error(`Error assigning goal to ${employee.name}: ${assignError.message}`);
    }

    return assignedGoal;
  });

  await Promise.all(assignedGoalsPromises);

  return { success: true };
};

export const getGoalById = async (goalId: string): Promise<GoalWithDetails | null> => {
  try {
    console.log(`Fetching goal with ID: ${goalId}`);
    
    // Get goal details
    const { data: goalData, error: goalError } = await supabase
      .from('hr_goals')
      .select('*')
      .eq('id', goalId)
      .single();
    
    if (goalError) {
      console.error('Error fetching goal details:', goalError);
      return null;
    }
    
    // Fetch assigned employees and assignments
    const { data: assignedData, error: assignedError } = await supabase
      .from('hr_assigned_goals')
      .select('*, hr_employees:employee_id(*)')
      .eq('goal_id', goalId);
    
    if (assignedError) {
      console.error('Error fetching assigned goals:', assignedError);
      return null;
    }
    
    // Map employees and assignments
    const assignedEmployees: Employee[] = [];
    const assignments: AssignedGoal[] = [];
    let instances: GoalInstance[] = [];
    let activeInstance: GoalInstance | undefined = undefined;
    
    if (assignedData && assignedData.length > 0) {
      // Process all assignments
      for (const assignment of assignedData) {
        // Add the assignment
        const assignmentDetails: AssignedGoal = {
          id: assignment.id,
          goalId: assignment.goal_id,
          employeeId: assignment.employee_id,
          status: assignment.status,
          progress: assignment.progress,
          currentValue: assignment.current_value,
          targetValue: assignment.target_value,
          notes: assignment.notes,
          assignedAt: assignment.assigned_at,
          goalType: assignment.goal_type
        };
        assignments.push(assignmentDetails);
        
        // Add the employee if available
        if (assignment.hr_employees) {
          const employee = assignment.hr_employees;
          const mappedEmployee: Employee = {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            position: employee.position || 'Employee',
            department: employee.department_id as any,
            email: employee.email,
            avatar: employee.profile_picture_url
          };
          
          // Check if employee is already in the array
          if (!assignedEmployees.some(e => e.id === mappedEmployee.id)) {
            assignedEmployees.push(mappedEmployee);
          }
        }
        
        // Fetch goal instances for this assignment
        const { data: instancesData, error: instancesError } = await supabase
          .from('hr_goal_instances')
          .select('*')
          .eq('assigned_goal_id', assignment.id)
          .order('period_start', { ascending: true });
        
        if (!instancesError && instancesData) {
          const assignmentInstances = instancesData.map(instance => ({
            id: instance.id,
            assignedGoalId: instance.assigned_goal_id,
            periodStart: instance.period_start,
            periodEnd: instance.period_end,
            targetValue: instance.target_value,
            currentValue: instance.current_value,
            progress: instance.progress,
            status: instance.status,
            createdAt: instance.created_at,
            updatedAt: instance.updated_at,
            notes: instance.notes
          }));
          
          instances = [...instances, ...assignmentInstances];
          
          // Find the current active instance
          const today = new Date().toISOString().split('T')[0];
          const currentInstance = assignmentInstances.find(
            instance => 
              new Date(instance.periodStart) <= new Date(today) && 
              new Date(instance.periodEnd) >= new Date(today)
          );
          
          // If we found an active instance, use it
          if (currentInstance && !activeInstance) {
            activeInstance = currentInstance;
          }
        }
      }
    }
    
    // If no active instance is found, use the latest one
    if (!activeInstance && instances.length > 0) {
      instances.sort((a, b) => 
        new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
      );
      activeInstance = instances[0];
    }
    
    // Calculate total values from all assignments
    const totalTargetValue = assignments.reduce((sum, a) => sum + a.targetValue, 0);
    let totalCurrentValue = assignments.reduce((sum, a) => sum + a.currentValue, 0);

    // For Submission and Onboarding goals, update the current value based on hr_status_change_counts
    const isSpecialGoal = goalData.name === "Submission" || goalData.name === "Onboarding";
    if (isSpecialGoal && activeInstance) {
      console.log(`Special goal type detected: ${goalData.name}`);
      
      // For each assignment, fetch and update the current value
      const countPromises = assignments.map(async (assignment) => {
        const currentValue = await getSubmissionOrOnboardingCounts(
          assignment.employeeId,
          goalData.name,
          activeInstance!.periodStart,
          activeInstance!.periodEnd
        );
        
        // Update the assignment's current value and progress
        assignment.currentValue = currentValue;
        if (assignment.targetValue > 0) {
          assignment.progress = Math.min(Math.round((currentValue / assignment.targetValue) * 100), 100);
        }
        
        // Update the assignment status based on progress
        if (assignment.progress >= 100) {
          assignment.status = 'completed';
        } else if (assignment.progress > 0) {
          assignment.status = 'in-progress';
        }
        
        return currentValue;
      });
      
      // Wait for all count fetches to complete
      const currentValues = await Promise.all(countPromises);
      totalCurrentValue = currentValues.reduce((sum, val) => sum + val, 0);
    }

    const overallProgress = totalTargetValue > 0 
      ? Math.min(Math.round((totalCurrentValue / totalTargetValue) * 100), 100)
      : 0;
    
    // Map goal with details
    const goal: GoalWithDetails = {
      id: goalData.id,
      name: goalData.name,
      description: goalData.description,
      sector: goalData.sector,
      targetValue: goalData.target_value,
      metricType: goalData.metric_type,
      metricUnit: goalData.metric_unit,
      startDate: goalData.start_date,
      endDate: goalData.end_date,
      createdAt: goalData.created_at,
      assignedTo: assignedEmployees,
      assignments: assignments,
      instances,
      activeInstance,
      totalTargetValue,
      totalCurrentValue,
      overallProgress
    };
    
    return goal;
  } catch (error) {
    console.error('Error in getGoalById:', error);
    return null;
  }
};

export const getTrackingRecordsForGoal = async (goalId: string, employeeId?: string): Promise<TrackingRecord[]> => {
  try {
    console.log(`Fetching tracking records for goal ID: ${goalId}`);
    
    // First get the assigned goal ID
    let query = supabase
      .from('hr_assigned_goals')
      .select('id')
      .eq('goal_id', goalId);
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    const { data: assignedGoals, error: assignedError } = await query;
    
    if (assignedError) {
      console.error('Error fetching assigned goals:', assignedError);
      return [];
    }
    
    if (!assignedGoals || assignedGoals.length === 0) {
      console.log('No assigned goals found');
      return [];
    }
    
    // Get all assigned goal IDs
    const assignedGoalIds = assignedGoals.map(ag => ag.id);
    
    // Fetch tracking records for these assigned goals
    const { data: trackingRecords, error: trackingError } = await supabase
      .from('tracking_records')
      .select('*')
      .in('assigned_goal_id', assignedGoalIds)
      .order('record_date', { ascending: false });
    
    if (trackingError) {
      console.error('Error fetching tracking records:', trackingError);
      return [];
    }
    
    return trackingRecords.map(mapTrackingRecordDbToTrackingRecord);
    
  } catch (error) {
    console.error('Error in getTrackingRecordsForGoal:', error);
    return [];
  }
};

export const getGoalInstances = async (assignedGoalId: string): Promise<GoalInstance[]> => {
  try {
    console.log(`Fetching goal instances for assigned goal ID: ${assignedGoalId}`);
    
    const { data, error } = await supabase
      .from('hr_goal_instances')
      .select('*')
      .eq('assigned_goal_id', assignedGoalId)
      .order('period_start', { ascending: true });
    
    if (error) {
      console.error('Error fetching goal instances:', error);
      return [];
    }
    
    return data.map((instance) => ({
      id: instance.id,
      assignedGoalId: instance.assigned_goal_id,
      periodStart: instance.period_start,
      periodEnd: instance.period_end,
      targetValue: instance.target_value,
      currentValue: instance.current_value,
      progress: instance.progress,
      status: instance.status,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
      notes: instance.notes
    }));
  } catch (error) {
    console.error('Error in getGoalInstances:', error);
    return [];
  }
};

export const getActiveGoalInstance = async (assignedGoalId: string): Promise<GoalInstance | null> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('hr_goal_instances')
      .select('*')
      .eq('assigned_goal_id', assignedGoalId)
      .lte('period_start', currentDate)
      .gte('period_end', currentDate)
      .single();
    
    if (error || !data) {
      console.log('No active instance found, fetching the latest instance');
      
      // If no active instance found, get the latest one
      const { data: latestData, error: latestError } = await supabase
        .from('hr_goal_instances')
        .select('*')
        .eq('assigned_goal_id', assignedGoalId)
        .order('period_end', { ascending: false })
        .limit(1)
        .single();
      
      if (latestError || !latestData) {
        console.error('Error fetching latest goal instance:', latestError);
        return null;
      }
      
      return {
        id: latestData.id,
        assignedGoalId: latestData.assigned_goal_id,
        periodStart: latestData.period_start,
        periodEnd: latestData.period_end,
        targetValue: latestData.target_value,
        currentValue: latestData.current_value,
        progress: latestData.progress,
        status: latestData.status,
        createdAt: latestData.created_at,
        updatedAt: latestData.updated_at,
        notes: latestData.notes
      };
    }
    
    return {
      id: data.id,
      assignedGoalId: data.assigned_goal_id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      targetValue: data.target_value,
      currentValue: data.current_value,
      progress: data.progress,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      notes: data.notes
    };
  } catch (error) {
    console.error('Error in getActiveGoalInstance:', error);
    return null;
  }
};

export const addTrackingRecord = async (
  assignedGoalId: string,
  value: number,
  recordDate: string = new Date().toISOString(),
  notes?: string
): Promise<TrackingRecord | null> => {
  try {
    // First, check if there's an active goal instance for this date
    const datePart = recordDate.split('T')[0]; // Extract just the YYYY-MM-DD part
    
    const { data: instanceData, error: instanceError } = await supabase
      .from('hr_goal_instances')
      .select('id')
      .eq('assigned_goal_id', assignedGoalId)
      .lte('period_start', datePart)
      .gte('period_end', datePart)
      .maybeSingle();
    
    if (instanceError) {
      console.error('Error checking goal instance:', instanceError);
      // Continue with tracking record creation regardless
    }
    
    // Insert the tracking record which will trigger our database function
    const { data, error } = await supabase
      .from('tracking_records')
      .insert({
        assigned_goal_id: assignedGoalId,
        record_date: recordDate,
        value,
        notes
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding tracking record:', error);
      return null;
    }
    
    // Database triggers will handle updating the goal instance and parent goal
    return mapTrackingRecordDbToTrackingRecord(data);
  } catch (error) {
    console.error('Error in addTrackingRecord:', error);
    return null;
  }
};

export const updateGoalProgress = async (
  assignedGoalId: string,
  currentValue: number,
  notes?: string
): Promise<AssignedGoal | null> => {
  try {
    // Update the assigned goal with new current value
    const { data, error } = await supabase
      .from('hr_assigned_goals')
      .update({
        current_value: currentValue,
        progress: currentValue * 100 / (data?.target_value || 1), // Calculate progress percentage
        updated_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', assignedGoalId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating goal progress:', error);
      return null;
    }
    
    return {
      id: data.id,
      goalId: data.goal_id,
      employeeId: data.employee_id,
      status: data.status,
      progress: data.progress,
      currentValue: data.current_value,
      targetValue: data.target_value,
      notes: data.notes,
      assignedAt: data.assigned_at,
      goalType: data.goal_type
    };
  } catch (error) {
    console.error('Error in updateGoalProgress:', error);
    return null;
  }
};

export const updateAssignedGoalTarget = async (
  assignedGoalId: string,
  targetValue: number
): Promise<AssignedGoal | null> => {
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('hr_assigned_goals')
      .select('current_value')
      .eq('id', assignedGoalId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current goal data:', fetchError);
      return null;
    }
    
    const currentValue = currentData.current_value;
    const progress = targetValue > 0 ? Math.min(Math.round((currentValue / targetValue) * 100), 100) : 0;
    
    const { data, error } = await supabase
      .from('hr_assigned_goals')
      .update({
        target_value: targetValue,
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignedGoalId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating goal target:', error);
      return null;
    }
    
    return {
      id: data.id,
      goalId: data.goal_id,
      employeeId: data.employee_id,
      status: data.status,
      progress: data.progress,
      currentValue: data.current_value,
      targetValue: data.target_value,
      notes: data.notes,
      assignedAt: data.assigned_at,
      goalType: data.goal_type
    };
  } catch (error) {
    console.error('Error in updateAssignedGoalTarget:', error);
    return null;
  }
};

export const getEmployeeGoals = async (employeeId: string): Promise<GoalWithDetails[]> => {
  try {
    console.log(`Fetching goals for employee ID: ${employeeId}`);
    
    // Original code to get assigned goals
    const { data: assignedGoalsData, error: assignedGoalsError } = await supabase
      .from('hr_assigned_goals')
      .select('*')
      .eq('employee_id', employeeId);
    
    if (assignedGoalsError) {
      console.error('Error fetching assigned goals for employee:', assignedGoalsError);
      return [];
    }

    if (!assignedGoalsData || assignedGoalsData.length === 0) {
      console.log('No goals assigned to this employee');
      return [];
    }

    console.log(`Found ${assignedGoalsData.length} assigned goals for employee`);
    
    const assignedGoals = assignedGoalsData.map(mapHrAssignedGoalToAssignedGoal);
    const goalIds = assignedGoals.map(ag => ag.goalId);
    
    const { data: goalsData, error: goalsError } = await supabase
      .from('hr_goals')
      .select('*')
      .in('id', goalIds);
    
    if (goalsError || !goalsData) {
      console.error('Error fetching goals details:', goalsError);
      return [];
    }
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select('*')
      .eq('id', employeeId)
      .single();
    
    if (employeeError ||
