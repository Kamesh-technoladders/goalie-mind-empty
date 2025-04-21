import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useStatusReport } from '@/hooks/useStatusReport';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { debounce } from 'lodash';
import { DateRangePickerField } from './DateRangePickerField';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable'; // Explicitly import autoTable
import StackedBarChart from './StackedBarChart';

// Colors for each status (vibrant purple, fuchsia, violet theme)
const COLORS = {
  Processed: '#8E2DE2', // Vibrant purple
  Interview: '#FF00FF', // Bright fuchsia
  Offered: '#BF00FF',   // Rich violet
  Joined: '#8E2DE2',    // Vibrant purple
};

const ClientWiseReport: React.FC = () => {
  const { isLoading, error, fetchClientReport } = useStatusReport();
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
    key: 'selection',
  });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const debouncedFetch = debounce(async (from: Date, to: Date) => {
    const data = await fetchClientReport(from, to);
    setReportData(data);
    if (data.length > 0 && !selectedClient) {
      setSelectedClient(data[0].name);
    }
  }, 500);

  useEffect(() => {
    debouncedFetch(dateRange.startDate, dateRange.endDate);
    return () => debouncedFetch.cancel();
  }, [dateRange.startDate, dateRange.endDate]);

  // Aggregate status counts across all clients for PieChart
  const pieChartData = reportData.reduce((acc, client) => {
    client.statusBreakdown.forEach(status => {
      const displayName = status.statusName === 'Interview' ? 'Interviewed' : status.statusName;
      const existing = acc.find(item => item.statusName === displayName);
      if (existing) {
        existing.count += status.count;
      } else {
        acc.push({ statusName: displayName, count: status.count });
      }
    });
    return acc;
  }, []).sort((a, b) => {
    const order = ['Processed', 'Interviewed', 'Offered', 'Joined'];
    return order.indexOf(a.statusName) - order.indexOf(b.statusName);
  });

  // Data for SimpleRadarChart based on selected client
  const radarChartData = selectedClient
    ? reportData
        .find(client => client.name === selectedClient)
        ?.statusBreakdown.map(status => ({
          statusName: status.statusName === 'Interview' ? 'Interviewed' : status.statusName,
          count: status.count,
        })) || []
    : [];

  // Transform reportData to match the chart's expected format
  const transformedData = reportData.map(client => ({
    name: client.name,
    Processed: client.statusBreakdown.find(s => s.statusName === 'Processed')?.count || 0,
    Interview: client.statusBreakdown.find(s => s.statusName === 'Interview')?.count || 0,
    Offered: client.statusBreakdown.find(s => s.statusName === 'Offered')?.count || 0,
    Joined: client.statusBreakdown.find(s => s.statusName === 'Joined')?.count || 0,
  }));

  // Inline styles for StackedBarChart
  const chartStyles = {
    container: {
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    bar: {
      transition: 'fill 0.3s ease',
    },
    xAxis: {
      fontSize: '13px',
      fontWeight: 500,
      fill: '#313244',
      fontFamily: 'Inter, sans-serif',
    },
    yAxis: {
      fontSize: '13px',
      fill: '#90909e',
      fontWeight: 500,
      fontFamily: 'Inter, sans-serif',
    },
    tooltip: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      padding: '8px',
      fontSize: '12px',
      color: '#1f2937',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    legend: {
      fontSize: '12px',
      fontWeight: 500,
      color: '#475569',
      paddingTop: '10px',
      fontFamily: 'Inter, sans-serif',
    },
  };

  // Custom label renderer for PieChart
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontFamily="Inter, sans-serif"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Client Name', 'Total Candidates', 'Processed', 'Interviewed', 'Offered', 'Joined'];
    const data = reportData.map(client => {
      const row = {
        'Client Name': client.name,
        'Total Candidates': client.totalCandidates,
      };
      client.statusBreakdown.forEach(status => {
        const key = status.statusName === 'Interview' ? 'Interviewed' : status.statusName;
        row[key] = status.count;
      });
      return headers.map(header => row[header] || 0);
    });

    const csv = Papa.unparse({
      fields: headers,
      data,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'client_wise_report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Client Wise Report', 14, 20);

    const headers = ['Client Name', 'Total Candidates', 'Processed', 'Interviewed', 'Offered', 'Joined'];
    const data = reportData.map(client => {
      const row = [client.name, client.totalCandidates];
      const statusCounts = {};
      client.statusBreakdown.forEach(status => {
        const key = status.statusName === 'Interview' ? 'Interviewed' : status.statusName;
        statusCounts[key] = status.count;
      });
      headers.slice(2).forEach(header => {
        row.push(statusCounts[header] || 0);
      });
      return row;
    });

    autoTable(doc, { // Use autoTable as a function with the doc instance
      head: [headers],
      body: data,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 100, 100] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save('client_wise_report.pdf');
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
  if (!reportData.length) {
    return (
      <Alert>
        <AlertDescription>No data available for the selected date range.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Report</h2>
        <DateRangePickerField
          dateRange={dateRange}
          onDateRangeChange={(range) => setDateRange(range)}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="radar">Client Radar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution by Client</CardTitle>
            </CardHeader>
            <CardContent>
              <StackedBarChart
                data={transformedData}
                colors={COLORS}
                inlineStyles={chartStyles}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="count"
                    nameKey="statusName"
                    cx="50%"
                    cy="50%"
                    outerRadius={200}
                    fill="#8884d8"
                    paddingAngle={0}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.statusName as keyof typeof COLORS] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Client Status Radar</CardTitle>
              <Select
                value={selectedClient || ''}
                onValueChange={setSelectedClient}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {reportData.map(client => (
                    <SelectItem key={client.name} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedClient && radarChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="statusName" />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar
                      name="Status"
                      dataKey="count"
                      stroke={COLORS.Offered} // Vibrant violet for radar stroke
                      fill={COLORS.Offered}   // Vibrant violet for radar fill
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Alert>
                  <AlertDescription>Please select a client to view the radar chart.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} variant="outline">
              Download CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">Client Name</TableHead>
                  <TableHead>Total Candidates</TableHead>
                  {reportData[0]?.statusBreakdown.map(status => (
                    <TableHead
                      key={status.statusName}
                      className="max-w-[150px] truncate"
                      title={status.statusName === 'Interview' ? 'Interviewed' : status.statusName}
                    >
                      {status.statusName === 'Interview' ? 'Interviewed' : status.statusName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map(client => (
                  <TableRow key={client.name}>
                    <TableCell className="sticky left-0 bg-white">{client.name}</TableCell>
                    <TableCell>{client.totalCandidates}</TableCell>
                    {client.statusBreakdown.map(status => (
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

export default ClientWiseReport;