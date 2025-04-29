import React, { useState, useEffect } from "react";
import GoalList from "@/components/goals/goals/GoalList";
import AnimatedCard from "@/components/ui/custom/AnimatedCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Calendar, 
  Goal, 
  Users, 
  CheckCircle2, 
  Clock,
  Target
} from "lucide-react";
import { getGoalsWithDetails, getSectorsWithCounts } from "@/lib/supabaseData";
import { GoalType, GoalWithDetails } from "@/types/goal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import CreateGoalForm from "@/components/goals/goals/CreateGoalForm";
import AssignGoalsForm from "@/components/goals/goals/AssignGoalsForm";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [goals, setGoals] = useState<GoalWithDetails[]>([]);
  const [sectors, setSectors] = useState<{name: string, count: number}[]>([]);
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"all" | GoalType>("all");
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [createGoalDialogOpen, setCreateGoalDialogOpen] = useState(false);
  const [assignGoalDialogOpen, setAssignGoalDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const goalsData = await getGoalsWithDetails();
        const sectorsData = await getSectorsWithCounts();
        
        // Fetch departments
        const { data: departmentsData, error } = await supabase
          .from('hr_departments')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error("Error fetching departments:", error);
        } else {
          setDepartments(departmentsData || []);
        }
        
        setGoals(goalsData);
        setSectors(sectorsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [createGoalDialogOpen, assignGoalDialogOpen]);
  
  // Filter goals by sector and timeframe
  const filteredGoals = goals
    .filter(goal => {
      if (selectedSector === "all") return true;
      return goal.sector.toLowerCase() === selectedSector.toLowerCase();
    });
  
  // Group goals by timeframe WITHOUT combining different timeframes into one card
  const groupGoalsByTimeframe = (goals: GoalWithDetails[], timeframe: GoalType): GoalWithDetails[] => {
    // For each goal, filter its assignments to only include assignments of the specified timeframe
    return goals.map(goal => {
      const timeframeAssignments = goal.assignments?.filter(a => a.goalType === timeframe) || [];
      
      // If this goal has no assignments for this timeframe, return null
      if (timeframeAssignments.length === 0) return null;
      
      // Calculate the total target/current values and progress for THIS timeframe only
      const timeframeTargetValue = timeframeAssignments.reduce((sum, a) => sum + a.targetValue, 0);
      const timeframeCurrentValue = timeframeAssignments.reduce((sum, a) => sum + a.currentValue, 0);
      const timeframeProgress = timeframeTargetValue > 0 
        ? Math.min(Math.round((timeframeCurrentValue / timeframeTargetValue) * 100), 100)
        : 0;
      
      // Get employees assigned to this timeframe
      const assignedToThisTimeframe = timeframeAssignments
        .map(a => goal.assignedTo?.find(e => e.id === a.employeeId))
        .filter(Boolean);
      
      // Return a new goal object with only the timeframe-specific data
      return {
        ...goal,
        assignments: timeframeAssignments,
        assignedTo: assignedToThisTimeframe,
        totalTargetValue: timeframeTargetValue,
        totalCurrentValue: timeframeCurrentValue,
        overallProgress: timeframeProgress
      };
    }).filter(Boolean) as GoalWithDetails[]; // Filter out null values
  };
  
  // Create separate goal lists for each timeframe
  const dailyGoals = groupGoalsByTimeframe(filteredGoals, 'Daily');
  const weeklyGoals = groupGoalsByTimeframe(filteredGoals, 'Weekly');
  const monthlyGoals = groupGoalsByTimeframe(filteredGoals, 'Monthly');
  const yearlyGoals = groupGoalsByTimeframe(filteredGoals, 'Yearly');
  
  // Apply timeframe filter when a specific timeframe is selected
  const timeframeFilteredGoals = selectedTimeframe === 'all' 
    ? filteredGoals 
    : groupGoalsByTimeframe(filteredGoals, selectedTimeframe as GoalType);
  
  // Goals statistics - calculated across all timeframes
  const totalGoals = goals.length;
  const inProgressGoals = goals.filter(
    goal => goal.assignments?.some(a => a.status === "in-progress")
  ).length;
  
  const completedGoals = goals.filter(
    goal => goal.assignments?.every(a => a.status === "completed")
  ).length;
  
  const pendingGoals = goals.filter(
    goal => goal.assignments?.every(a => a.status === "pending")
  ).length;
  
  // Count unique employees assigned to goals
  const uniqueEmployeeIds = new Set<string>();
  goals.forEach(goal => {
    if (goal.assignedTo) {
      goal.assignedTo.forEach(employee => uniqueEmployeeIds.add(employee.id));
    }
  });
  const assignedEmployeesCount = uniqueEmployeeIds.size;
  
  // Count goals by type
  const goalsByType = goals.reduce((acc, goal) => {
    if (goal.assignments) {
      goal.assignments.forEach(assignment => {
        acc[assignment.goalType] = (acc[assignment.goalType] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const handleTimeframeChange = (timeframe: "all" | GoalType) => {
    setSelectedTimeframe(timeframe);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 pt-24 pb-12">
        <section className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold mb-2">Goal Module</h1>
              <p className="text-gray-600">
                Track and manage employee goals across all departments
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={createGoalDialogOpen} onOpenChange={setCreateGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Goal className="h-4 w-4" />
                    <span>Create Goal</span>
                  </Button>
                </DialogTrigger>
                <CreateGoalForm onClose={() => setCreateGoalDialogOpen(false)} />
              </Dialog>
              
              <Dialog open={assignGoalDialogOpen} onOpenChange={setAssignGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Assign Goals</span>
                  </Button>
                </DialogTrigger>
                <AssignGoalsForm onClose={() => setAssignGoalDialogOpen(false)} />
              </Dialog>
            </div>
          </div>
          
          {/* Department Tabs */}
          <Tabs defaultValue="all" className="w-full mb-6">
            <TabsList className={`grid grid-cols-2 md:grid-cols-${Math.min(departments.length + 1, 7)} w-full md:w-auto`}>
              <TabsTrigger 
                value="all" 
                onClick={() => setSelectedSector("all")}
                className="px-4 py-2"
              >
                All
              </TabsTrigger>
              
              {departments.map(department => (
                <TabsTrigger 
                  key={department.id}
                  value={department.name.toLowerCase()} 
                  onClick={() => setSelectedSector(department.name.toLowerCase())}
                  className="px-4 py-2"
                >
                  {department.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Timeframe Tabs */}
          <Tabs defaultValue="all" className="w-full mb-6">
            <TabsList className="grid grid-cols-5 w-full md:w-auto">
              <TabsTrigger 
                value="all" 
                onClick={() => handleTimeframeChange("all")}
                className="px-4 py-2"
              >
                All Timeframes
              </TabsTrigger>
              
              <TabsTrigger 
                value="Daily" 
                onClick={() => handleTimeframeChange("Daily")}
                className="px-4 py-2"
              >
                Daily
              </TabsTrigger>
              
              <TabsTrigger 
                value="Weekly" 
                onClick={() => handleTimeframeChange("Weekly")}
                className="px-4 py-2"
              >
                Weekly
              </TabsTrigger>
              
              <TabsTrigger 
                value="Monthly" 
                onClick={() => handleTimeframeChange("Monthly")}
                className="px-4 py-2"
              >
                Monthly
              </TabsTrigger>
              
              <TabsTrigger 
                value="Yearly" 
                onClick={() => handleTimeframeChange("Yearly")}
                className="px-4 py-2"
              >
                Yearly
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* ... keep existing code (statistics cards) */}
            <AnimatedCard 
              animation="fade" 
              delay={100}
              className="bg-white flex items-start p-6"
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <Goal className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Goals</p>
                <h3 className="text-2xl font-bold">{totalGoals}</h3>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-100">
                    {sectors.length} Sectors
                  </Badge>
                </div>
              </div>
            </AnimatedCard>
            
            <AnimatedCard 
              animation="fade" 
              delay={200}
              className="bg-white flex items-start p-6"
            >
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <h3 className="text-2xl font-bold">{inProgressGoals}</h3>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-100">
                    {totalGoals > 0 ? Math.round((inProgressGoals / totalGoals) * 100) : 0}% of total
                  </Badge>
                </div>
              </div>
            </AnimatedCard>
            
            <AnimatedCard 
              animation="fade" 
              delay={300}
              className="bg-white flex items-start p-6"
            >
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <h3 className="text-2xl font-bold">{completedGoals}</h3>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-100">
                    {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}% of total
                  </Badge>
                </div>
              </div>
            </AnimatedCard>
            
            <AnimatedCard 
              animation="fade" 
              delay={400}
              className="bg-white flex items-start p-6"
            >
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Assigned To</p>
                <h3 className="text-2xl font-bold">{assignedEmployeesCount}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(goalsByType).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-100">
                      {count} {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </div>
          
          {loading ? (
            <div className="text-center py-10">Loading goals data...</div>
          ) : (
            <>
              {selectedTimeframe === "all" ? (
                <>
                  {/* Display goals separated by timeframe */}
                  {dailyGoals.length > 0 && (
                    <GoalList goals={dailyGoals} title="Daily Goals" />
                  )}
                  
                  {weeklyGoals.length > 0 && (
                    <GoalList goals={weeklyGoals} title="Weekly Goals" className="mt-10" />
                  )}
                  
                  {monthlyGoals.length > 0 && (
                    <GoalList goals={monthlyGoals} title="Monthly Goals" className="mt-10" />
                  )}
                  
                  {yearlyGoals.length > 0 && (
                    <GoalList goals={yearlyGoals} title="Yearly Goals" className="mt-10" />
                  )}
                  
                  {dailyGoals.length === 0 && weeklyGoals.length === 0 && 
                   monthlyGoals.length === 0 && yearlyGoals.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No goals found</p>
                    </div>
                  )}
                </>
              ) : (
                <GoalList 
                  goals={timeframeFilteredGoals}
                  title={`${selectedTimeframe} Goals`}
                />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
