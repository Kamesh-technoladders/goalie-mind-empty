// src/components/reports/IndividualReport.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useStatusReport } from '@/hooks/useStatusReport';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComparisonChart } from './ComparisonChart';
import { debounce } from 'lodash';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRangePickerField } from './DateRangePickerField';

const COLORS = [
  '#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD', '#6D28D9', '#9333EA',
  '#A855F7', '#D8B4FE', '#E9D5FF', '#5B21B6', '#4C1D95', '#7E22CE',
  '#9D4EDD', '#BF94E4', '#D9D6FE', '#E0B0FF', '#D6BCFA', '#B794F4',
  '#C084FC', '#E879F9', '#F0ABFC', '#F5D0FE', '#C7D2FE', '#A5B4FC',
  '#818CF8', '#6366F1',
];

const statusOrder = [
  'Processed - Processed (Internal)',
  'Processed - Processed (Client)',
  'Processed - Duplicate (Internal)',
  'Processed - Duplicate (Client)',
  'Processed - Internal Reject',
  'Processed - Client Reject',
  'Processed - Candidate on hold',
  'Interview - Technical Assessment',
  'Interview - Reschedule Interview',
  'Interview - Technical Assessment Selected',
  'Interview - Technical Assessment Rejected',
  'Interview - L1',
  'Interview - L1 Selected',
  'Interview - L1 Rejected',
  'Interview - L2',
  'Interview - L2 Selected',
  'Interview - L2 Rejected',
  'Interview - L3',
  'Interview - L3 Selected',
  'Interview - L3 Rejected',
  'Interview - End Client Round',
  'Interview - End Client Selected',
  'Interview - End Client Rejected',
  'Offered - Offer Issued',
  'Offered - Offer On Hold',
  'Joined - Joined',
  'Joined - No Show',
];

const IndividualReport: React.FC = () => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(statusOrder);
  const { isLoading, error, fetchIndividualReport } = useStatusReport();
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
    key: 'selection',
  });

  const debouncedFetch = debounce(async (from: Date, to: Date) => {
    const data = await fetchIndividualReport(from, to);
    const sortedData = data.map(item => ({
      ...item,
      statusBreakdown: statusOrder.map(statusName => ({
        statusName,
        count: item.statusBreakdown.find(s => s.statusName === statusName)?.count || 0,
      })),
      dailyData: item.dailyData.map(day => ({
        ...day,
        ...Object.fromEntries(
          Object.entries(day).filter(([key]) => key === 'date' || statusOrder.includes(key))
        ),
      })),
    }));
    setReportData(sortedData);
  }, 500);

  useEffect(() => {
    debouncedFetch(dateRange.startDate, dateRange.endDate);
    return () => debouncedFetch.cancel();
  }, [dateRange.startDate, dateRange.endDate]);

  const handleStatusChange = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleEmployeeChange = (employee: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employee)
        ? prev.filter(e => e !== employee)
        : [...prev, employee]
    );
  };

  const filteredReportData = reportData
    .filter(employee => selectedEmployees.length === 0 || selectedEmployees.includes(employee.name))
    .map(employee => ({
      ...employee,
      statusBreakdown: employee.statusBreakdown.filter(s => selectedStatuses.includes(s.statusName)),
      dailyData: employee.dailyData.map(day => ({
        ...day,
        ...Object.fromEntries(
          Object.entries(day).filter(([key]) => key === 'date' || selectedStatuses.includes(key))
        ),
      })),
    }));

  const comparisonData = () => {
    const selectedEmployee1 = selectedEmployees[0];
    const selectedEmployee2 = selectedEmployees[1];

    if (!selectedEmployee1 || !selectedEmployee2) {
      return filteredReportData[0]?.dailyData || [];
    }

    const employee1Data = filteredReportData.find(emp => emp.name === selectedEmployee1)?.dailyData || [];
    const employee2Data = filteredReportData.find(emp => emp.name === selectedEmployee2)?.dailyData || [];

    if (!employee1Data.length && !employee2Data.length) {
      return [];
    }

    const allDates = [...new Set([
      ...employee1Data.map(d => d.date),
      ...employee2Data.map(d => d.date),
    ])].sort();

    const mergedData = allDates.map(date => {
      const emp1Day = employee1Data.find(d => d.date === date) || {};
      const emp2Day = employee2Data.find(d => d.date === date) || {};
      const dataPoint = { date };

      const emp1Total = selectedStatuses.reduce((sum, status) => sum + (emp1Day[status] || 0), 0);
      const emp2Total = selectedStatuses.reduce((sum, status) => sum + (emp2Day[status] || 0), 0);

      dataPoint[selectedEmployee1] = emp1Total;
      dataPoint[selectedEmployee2] = emp2Total;

      return dataPoint;
    });

    return mergedData;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!filteredReportData.length && selectedEmployees.length > 0) {
    return (
      <Alert>
        <AlertDescription>No data available for the selected employees or statuses.</AlertDescription>
      </Alert>
    );
  }
  if (!reportData.length) {
    return (
      <Alert>
        <AlertDescription>No data available for the selected date range.</AlertDescription>
      </Alert>
    );
  }

  const employeeItems = reportData.map(employee => ({
    id: employee.name,
    name: employee.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Individual Report</h2>
        <DateRangePickerField
          dateRange={dateRange}
          onDateRangeChange={(range) => setDateRange(range)}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">Filter Employees</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-1 w-full">
                  {selectedEmployees.length === 0
                    ? 'All Employees'
                    : selectedEmployees.length === employeeItems.length
                    ? 'All Employees'
                    : `${selectedEmployees.length} Employees Selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {employeeItems.map(employee => (
                    <div key={employee.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={employee.id}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleEmployeeChange(employee.id)}
                      />
                      <Label htmlFor={employee.id} className="text-sm">
                        {employee.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700">Filter Statuses</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-1 w-full">
                  {selectedStatuses.length === statusOrder.length
                    ? 'All Statuses'
                    : `${selectedStatuses.length} Statuses Selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {statusOrder.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => handleStatusChange(status)}
                      />
                      <Label htmlFor={status} className="text-sm">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution by Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredReportData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    style={{ fontSize: '12px', fill: '#666' }}
                  />
                  <YAxis
                    style={{ fontSize: '12px', fill: '#666' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}
                    itemStyle={{ color: '#333', fontSize: '12px' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    layout="vertical"
                    style={{ fontSize: '12px', color: '#333' }}
                  />
                  {selectedStatuses.map((status, index) => (
                    <Bar
                      key={status}
                      dataKey={`statusBreakdown[${filteredReportData[0]?.statusBreakdown.findIndex(s => s.statusName === status)}].count`}
                      name={status}
                      fill={COLORS[index % COLORS.length]}
                      stackId="a"
                      radius={[5, 5, 0, 0]}
                      style={{ transition: 'all 0.3s ease-in-out' }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Individual Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReportData.length > 0 && filteredReportData[0]?.dailyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={filteredReportData[0].dailyData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedStatuses
                      .filter(status => filteredReportData[0].dailyData.some(day => day[status]))
                      .map((status, index) => (
                        <Area
                          key={status}
                          type="monotone"
                          dataKey={status}
                          name={status}
                          fill={COLORS[index % COLORS.length]}
                          stroke={COLORS[index % COLORS.length]}
                          stackId="1"
                        />
                      ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Alert>
                  <AlertDescription>No trend data available for the selected employees or statuses.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Employee Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployees.length < 2 ? (
                <Alert>
                  <AlertDescription>Please select at least two employees to compare.</AlertDescription>
                </Alert>
              ) : comparisonData().length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No data available for the selected employees and statuses. Try selecting more statuses or adjusting the date range.
                  </AlertDescription>
                </Alert>
              ) : (
                <ComparisonChart
                  data={comparisonData()}
                  type="employee"
                  items={employeeItems}
                  selectedFirst={selectedEmployees[0]}
                  selectedSecond={selectedEmployees[1]}
                  onFirstChange={value => {
                    const newSelected = [...selectedEmployees];
                    newSelected[0] = value;
                    setSelectedEmployees(newSelected);
                  }}
                  onSecondChange={value => {
                    const newSelected = [...selectedEmployees];
                    newSelected[1] = value;
                    setSelectedEmployees(newSelected);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution by Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={selectedStatuses.map(statusName => ({
                      statusName,
                      count: filteredReportData[0]?.statusBreakdown.find(s => s.statusName === statusName)?.count || 0,
                    }))}
                    dataKey="count"
                    nameKey="statusName"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  >
                    {selectedStatuses.map((status, index) => (
                      <Cell key={status} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">Employee Name</TableHead>
                  <TableHead>Total Candidates</TableHead>
                  {selectedStatuses.map(status => (
                    <TableHead
                      key={status}
                      className="max-w-[150px] truncate"
                      title={status}
                    >
                      {status}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportData.map(employee => (
                  <TableRow key={employee.name}>
                    <TableCell className="sticky left-0 bg-white">{employee.name}</TableCell>
                    <TableCell>{employee.totalCandidates}</TableCell>
                    {employee.statusBreakdown.map(status => (
                      <TableCell key={status.statusName}>{status.count}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualReport;