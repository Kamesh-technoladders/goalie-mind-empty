import { supabase } from "@/integrations/supabase/client";
import { Employee, Goal, AssignedGoal, GoalWithDetails, KPI, TrackingRecord, GoalType } from "@/types/goal";

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

export const getGoalsWithDetails = async (): Promise<GoalWithDetails[]> => {
  try {
    const goals = await getGoals();
    const assignedGoals = await getAssignedGoals();
    const employees = await getEmployees();
    
    return goals.map(goal => {
      const assignments = assignedGoals.filter(ag => ag.goalId === goal.id);
      const assignedEmployees = assignments
        .map(a => employees.find(e => e.id === a.employeeId))
        .filter(Boolean) as Employee[];
      
      return {
        ...goal,
        assignedTo: assignedEmployees,
        assignmentDetails: assignments[0] // Just get the first assignment for simplicity
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
    
    if (employeeError || !employeeData) {
      console.error('Error fetching employee details:', employeeError);
      return [];
    }
    
    const employee = mapHrEmployeeToEmployee(employeeData);
    
    const goalsWithDetails: GoalWithDetails[] = [];
    
    for (const hrGoal of goalsData) {
      const { data: kpisData, error: kpisError } = await supabase
        .from('hr_kpis')
        .select('*')
        .eq('goal_id', hrGoal.id);
      
      if (kpisError) {
        console.error(`Error fetching KPIs for goal ${hrGoal.id}:`, kpisError);
      }
      
      const kpis = kpisData ? kpisData.map(mapHrKpiToKpi) : [];
      const goal = mapHrGoalToGoal(hrGoal, kpis);
      
      const assignmentDetails = assignedGoals.find(ag => ag.goalId === goal.id);
      
      if (assignmentDetails) {
        // Fetch goal instances
        const { data: instancesData, error: instancesError } = await supabase
          .from('hr_goal_instances')
          .select('*')
          .eq('assigned_goal_id', assignmentDetails.id)
          .order('period_start', { ascending: true });
        
        let instances: GoalInstance[] = [];
        let activeInstance: GoalInstance | undefined = undefined;
        
        if (!instancesError && instancesData) {
          instances = instancesData.map(instance => ({
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
          
          // Find the current active instance
          const today = new Date().toISOString().split('T')[0];
          activeInstance = instances.find(
            instance => 
              new Date(instance.periodStart) <= new Date(today) && 
              new Date(instance.periodEnd) >= new Date(today)
          );
          
          // If no active instance is found, use the latest one
          if (!activeInstance && instances.length > 0) {
            activeInstance = instances[instances.length - 1];
          }
        }
        
        goalsWithDetails.push({
          ...goal,
          assignedTo: [employee],
          assignmentDetails,
          instances,
          activeInstance
        });
      }
    }
    
    console.log(`Prepared ${goalsWithDetails.length} goals with details for employee`);
    return goalsWithDetails;
  } catch (error) {
    console.error('Error in getEmployeeGoals:', error);
    return [];
  }
};

export const getGoalById = async (goalId: string): Promise<GoalWithDetails | null> => {
  try {
    console.log(`Fetching goal with ID: ${goalId}`);
    
    // Original code to get the goal details
    const { data: goalData, error: goalError } = await supabase
      .from('hr_goals')
      .select('*')
      .eq('id', goalId)
      .single();
    
    if (goalError) {
      console.error('Error fetching goal details:', goalError);
      return null;
    }
    
    // Fetch assigned employees
    const { data: assignedData, error: assignedError } = await supabase
      .from('hr_assigned_goals')
      .select('*, hr_employees:employee_id(*)')
      .eq('goal_id', goalId);
    
    if (assignedError) {
      console.error('Error fetching assigned goals:', assignedError);
      return null;
    }
    
    // Map employees and assignment details
    const assignedEmployees: Employee[] = [];
    let assignmentDetails = null;
    let instances: GoalInstance[] = [];
    let activeInstance: GoalInstance | undefined = undefined;
    
    if (assignedData && assignedData.length > 0) {
      // For each assignment, gather employee info
      assignedData.forEach(assignment => {
        if (assignment.hr_employees) {
          const employee = assignment.hr_employees;
          assignedEmployees.push({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            position: employee.position || 'Employee',
            department: employee.department_id as any,
            email: employee.email,
            avatar: employee.profile_picture_url
          });
        }
        
        // For simplicity, we just take the first assignment details
        // In a real app, you might handle multiple assignments differently
        if (!assignmentDetails) {
          assignmentDetails = {
            id: assignment.id,
            goalId: assignment.goal_id,
            employeeId: assignment.employee_id,
            status: assignment.status,
            progress: assignment.progress,
            currentValue: assignment.current_value,
            targetValue: assignment.target_value,
            notes: assignment.notes,
            assignedAt: assignment.assigned_at,
            goalType: assignment.goal_type as any
          };
          
          // Fetch goal instances for this assignment
          const fetchInstances = async () => {
            const { data: instancesData, error: instancesError } = await supabase
              .from('hr_goal_instances')
              .select('*')
              .eq('assigned_goal_id', assignment.id)
              .order('period_start', { ascending: true });
            
            if (!instancesError && instancesData) {
              instances = instancesData.map(instance => ({
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
              
              // Find the current active instance
              const today = new Date().toISOString().split('T')[0];
              activeInstance = instances.find(
                instance => 
                  new Date(instance.periodStart) <= new Date(today) && 
                  new Date(instance.periodEnd) >= new Date(today)
              );
              
              // If no active instance is found, use the latest one
              if (!activeInstance && instances.length > 0) {
                activeInstance = instances[instances.length - 1];
              }
            }
          };
          
          // Need to use async/await or Promise here
          fetchInstances();
        }
      });
    }
    
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
      assignmentDetails,
      instances,
      activeInstance
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
    const { data: currentGoalData, error: fetchError } = await supabase
      .from('hr_assigned_goals')
      .select('*')
      .eq('id', assignedGoalId)
      .single();
    
    if (fetchError || !currentGoalData) {
      console.error('Error fetching assigned goal details:', fetchError);
      return null;
    }
    
    const targetValue = currentGoalData.target_value;
    const progress = calculateGoalProgress(currentValue, targetValue);
    
    const goalEndDate = new Date(currentGoalData.hr_goals.end_date);
    const now = new Date();
    const isPastDeadline = now > goalEndDate;
    
    let status: 'pending' | 'in-progress' | 'completed' | 'overdue' = 'pending';
    
    if (progress >= 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = isPastDeadline ? 'overdue' : 'in-progress';
    } else if (isPastDeadline) {
      status = 'overdue';
    }
    
    console.log(`Updating goal: Current value: ${currentValue}, Progress: ${progress}%, Status: ${status}`);
    
    const { data, error } = await supabase
      .from('hr_assigned_goals')
      .update({
        current_value: currentValue,
        progress: progress,
        status: status,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignedGoalId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating goal progress:', error);
      return null;
    }
    
    return mapHrAssignedGoalToAssignedGoal(data);
  } catch (error) {
    console.error('Error in updateGoalProgress:', error);
    return null;
  }
};

const calculateGoalProgress = (currentValue: number, targetValue: number): number => {
  if (targetValue === 0) return 0;
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.round(progress), 100);
};
