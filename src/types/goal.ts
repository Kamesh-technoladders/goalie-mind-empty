
export type SectorType = 'HR' | 'Sales' | 'Finance' | 'Operations' | 'Marketing';
export type MetricType = 'percentage' | 'currency' | 'count' | 'hours' | 'custom';
export type GoalType = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: SectorType;
  email: string;
  avatar?: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  sector: SectorType;
  targetValue: number;
  metricType: MetricType;
  metricUnit: string;
  startDate: string;
  endDate: string;
  kpis?: KPI[];
  createdAt: string;
}

export interface KPI {
  id: string;
  name: string;
  weight: number; // Percentage weight towards overall goal
  currentValue: number;
  targetValue: number;
  metricType: MetricType;
  metricUnit: string;
}

export interface EmployeeGoalTarget {
  employee: Employee;
  targetValue: number;
}

export interface AssignedGoal {
  id: string;
  goalId: string;
  employeeId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number; // 0-100 percentage
  currentValue: number;
  targetValue: number; // Added field to match database update
  notes?: string;
  assignedAt: string;
  goalType: GoalType;
}

export interface GoalInstance {
  id: string;
  assignedGoalId: string;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface GoalWithDetails extends Goal {
  assignedTo?: Employee[];
  assignments?: AssignedGoal[];  // Updated to store all assignments (not just the first one)
  instances?: GoalInstance[];
  activeInstance?: GoalInstance;
  totalTargetValue?: number;     // Sum of all target values
  totalCurrentValue?: number;    // Sum of all current values
  overallProgress?: number;      // Overall progress across all assignments
}

export interface TrackingRecord {
  id: string;
  assignedGoalId: string;
  recordDate: string;
  value: number;
  notes?: string;
  createdAt: string;
}
