
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Filter, Calendar, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import EnhancedGoalCard from "@/components/goals/common/EnhancedGoalCard";
import GoalProgressTable from "@/components/goals/common/GoalProgressTable";
import { GoalPieChart } from "@/components/goals/charts/GoalPieChart";
import { GoalType, GoalWithDetails, Employee, GoalStatistics } from "@/types/goal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { calculateGoalStatistics } from "@/lib/goalService";

interface EmployeeGoalDashboardProps {
  goals: GoalWithDetails[];
  employee?: Employee;
  title?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

const EmployeeGoalDashboard: React.FC<EmployeeGoalDashboardProps> = ({
  goals,
  employee,
  title = "My Goals",
  loading = false,
  onRefresh
}) => {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"all" | GoalType>("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [filteredGoals, setFilteredGoals] = useState<GoalWithDetails[]>(goals);
  const [goalStats, setGoalStats] = useState<GoalStatistics>({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    overdueGoals: 0,
    pendingGoals: 0,
    completionRate: 0,
  });
  
  useEffect(() => {
    // Apply filters based on selected timeframe and status
    let result = [...goals];
    
    // Filter by timeframe
    if (selectedTimeframe !== 'all') {
      result = result.filter(goal => 
        goal.assignments?.some(assignment => 
          assignment.goalType === selectedTimeframe
        )
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter(goal => 
        goal.assignments?.some(assignment => 
          assignment.status === selectedStatus
        )
      );
    }
    
    setFilteredGoals(result);
    
    // Calculate statistics
    const stats = calculateGoalStatistics(result);
    setGoalStats(stats);
  }, [goals, selectedTimeframe, selectedStatus]);
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe as "all" | GoalType);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First, update special goals on the server
      const { updateSpecialGoals } = await import('@/lib/supabaseData');
      await updateSpecialGoals();
      
      // Then trigger the regular refresh
      if (onRefresh) {
        onRefresh();
      }
      
      toast({
        title: "Goals refreshed",
        description: "Goal values have been updated from the server.",
      });
    } catch (error) {
      console.error("Error refreshing goals:", error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  // Data for the pie charts
  const statusChartData = [
    { name: 'Completed', value: goalStats.completedGoals, color: '#10b981' },
    { name: 'In Progress', value: goalStats.inProgressGoals, color: '#3b82f6' },
    { name: 'Overdue', value: goalStats.overdueGoals, color: '#ef4444' },
    { name: 'Pending', value: goalStats.pendingGoals, color: '#f59e0b' }
  ];
  
  // Count goals by timeframe
  const dailyGoals = goals.filter(goal => 
    goal.assignments?.some(a => a.goalType === 'Daily')
  ).length;
  
  const weeklyGoals = goals.filter(goal => 
    goal.assignments?.some(a => a.goalType === 'Weekly')
  ).length;
  
  const monthlyGoals = goals.filter(goal => 
    goal.assignments?.some(a => a.goalType === 'Monthly')
  ).length;
  
  const yearlyGoals = goals.filter(goal => 
    goal.assignments?.some(a => a.goalType === 'Yearly')
  ).length;
  
  const timeframeChartData = [
    { name: 'Daily', value: dailyGoals, color: '#8b5cf6' },
    { name: 'Weekly', value: weeklyGoals, color: '#ec4899' },
    { name: 'Monthly', value: monthlyGoals, color: '#06b6d4' },
    { name: 'Yearly', value: yearlyGoals, color: '#f97316' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Timeframe filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4 mr-1" />
                {selectedTimeframe === 'all' ? 'All Timeframes' : selectedTimeframe}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={selectedTimeframe} onValueChange={handleTimeframeChange}>
                <DropdownMenuRadioItem value="all">All Timeframes</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Daily">Daily</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Weekly">Weekly</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Monthly">Monthly</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Yearly">Yearly</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={selectedStatus} onValueChange={handleStatusChange}>
                <DropdownMenuRadioItem value="all">All Statuses</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="in-progress">In Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="overdue">Overdue</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Refresh button */}
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing..." : loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
      
      {/* Statistics and Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <GoalProgressTable 
              employee={employee}
              goalStats={goalStats}
            />
          </CardContent>
        </Card>
        
        <Tabs defaultValue="status" className="col-span-2">
          <TabsList className="mb-2">
            <TabsTrigger value="status">Goal Status</TabsTrigger>
            <TabsTrigger value="timeframe">Goal Timeframe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Goal Status Distribution</h3>
                <div className="h-64">
                  <GoalPieChart data={statusChartData} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeframe" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Goals by Timeframe</h3>
                <div className="h-64">
                  <GoalPieChart data={timeframeChartData} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Goals Grid */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading goals...</p>
        </div>
      ) : (
        filteredGoals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No goals found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <EnhancedGoalCard 
                key={goal.id}
                goal={goal}  // Pass the full goal object for backward compatibility
                onUpdate={onRefresh}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default EmployeeGoalDashboard;
