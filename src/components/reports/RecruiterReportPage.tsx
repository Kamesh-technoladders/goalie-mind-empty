import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePickerField } from './DateRangePickerField';
import { startOfMonth, endOfMonth } from 'date-fns';
import FunnelChart from './FunnelChart';
import RecruiterPerformanceTable from './RecruiterPerformanceTable';
import { PieChartComponent } from './PieChartComponent';
import RecruiterRadarChart from './RadarChart';
import HeatmapChart from './HeatmapChart';
import { useStatusReport } from '@/hooks/useStatusReport';

interface RecruiterPerformanceData {
  recruiter: string;
  jobs_assigned: number;
  profiles_submitted: number;
  internal_reject: number;
  internal_hold: number;
  sent_to_client: number;
  client_reject: number;
  client_hold: number;
  client_duplicate: number;
  interviews: {
    technical: number;
    technical_selected: number;
    technical_reject: number;
    l1: number;
    l1_selected: number;
    l1_reject: number;
    l2: number;
    l2_reject: number;
    end_client: number;
    end_client_reject: number;
  };
  offers: {
    made: number;
    accepted: number;
    rejected: number;
  };
  joining: {
    joined: number;
    no_show: number;
  };
}

const RecruiterReportPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
    key: string;
  }>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    key: 'selection',
  });

  const { isLoading, error, fetchRecruiterReport } = useStatusReport();
  const [data, setData] = useState<RecruiterPerformanceData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (dateRange.startDate && dateRange.endDate) {
        const reportData = await fetchRecruiterReport(dateRange.startDate, dateRange.endDate);
        setData(reportData);
        const totalSubmitted = reportData.reduce((sum, rec) => sum + rec.profiles_submitted, 0);
        if (totalSubmitted > 87) {
          console.warn(`Total profiles_submitted (${totalSubmitted}) exceeds expected 87 unique candidates. Check deduplication in fetchRecruiterReport.`);
        }
      }
    };

    fetchData();
  }, [dateRange]);

  // Colors for charts
  const COLORS = [
    '#4f46e5', '#3b82f6', '#10b981', '#8b5cf6', '#f97316',
    '#ec4899', '#14b8a6', '#f43f5e', '#eab308', '#a855f7'
  ];

  // Generate funnel chart data
  const getFunnelData = () => {
    const totalSubmitted = data.reduce((sum, rec) => sum + rec.profiles_submitted, 0);
    const totalToClient = data.reduce((sum, rec) => sum + rec.sent_to_client, 0);
    const totalTechnical = data.reduce((sum, rec) => sum + rec.interviews.technical, 0);
    const totalTechnicalSelected = data.reduce((sum, rec) => sum + rec.interviews.technical_selected, 0);
    const totalL1 = data.reduce((sum, rec) => sum + rec.interviews.l1, 0);
    const totalL1Selected = data.reduce((sum, rec) => sum + rec.interviews.l1_selected, 0);
    const totalL2 = data.reduce((sum, rec) => sum + rec.interviews.l2, 0);
    const totalEndClient = data.reduce((sum, rec) => sum + rec.interviews.end_client, 0);
    const totalOffers = data.reduce((sum, rec) => sum + rec.offers.made, 0);
    const totalAccepted = data.reduce((sum, rec) => sum + rec.offers.accepted, 0);
    const totalJoined = data.reduce((sum, rec) => sum + rec.joining.joined, 0);

    return [
      { name: 'Profiles Submitted', value: totalSubmitted, fill: '#4f46e5' },
      { name: 'Sent to Client', value: totalToClient, fill: '#3b82f6' },
      { name: 'Technical Interview', value: totalTechnical, fill: '#10b981' },
      { name: 'Technical Selected', value: totalTechnicalSelected, fill: '#14b8a6' },
      { name: 'L1 Interview', value: totalL1, fill: '#8b5cf6' },
      { name: 'L1 Selected', value: totalL1Selected, fill: '#a855f7' },
      { name: 'L2 Interview', value: totalL2, fill: '#f97316' },
      { name: 'End Client Interview', value: totalEndClient, fill: '#ec4899' },
      { name: 'Offers Made', value: totalOffers, fill: '#eab308' },
      { name: 'Offers Accepted', value: totalAccepted, fill: '#14b8a6' },
      { name: 'Joined', value: totalJoined, fill: '#f43f5e' }
    ];
  };

  // Generate offer outcomes pie chart data
  const getOfferOutcomesData = () => {
    const totalAccepted = data.reduce((sum, rec) => sum + rec.offers.accepted, 0);
    const totalRejected = data.reduce((sum, rec) => sum + rec.offers.rejected, 0);

    return [
      { name: 'Accepted', value: totalAccepted, fill: '#10b981' },
      { name: 'Rejected', value: totalRejected, fill: '#f43f5e' }
    ];
  };

  // Generate joining outcomes pie chart data
  const getJoiningOutcomesData = () => {
    const totalJoined = data.reduce((sum, rec) => sum + rec.joining.joined, 0);
    const totalNoShow = data.reduce((sum, rec) => sum + rec.joining.no_show, 0);

    return [
      { name: 'Joined', value: totalJoined, fill: '#10b981' },
      { name: 'No Show', value: totalNoShow, fill: '#f43f5e' }
    ];
  };

  // Generate radar chart data
  const getRadarData = () => {
    const metrics = [
      'Submission-to-Client',
      'Client Acceptance',
      'Technical Conversion',
      'Technical→L1',
      'L1→L1 Selected',
      'L1→L2 Conversion',
      'L2→End Client',
      'Offer Acceptance',
      'Join Rate',
      'Funnel Efficiency'
    ];

    const radarData = metrics.map(metric => {
      const result: any = { subject: metric };

      data.forEach(recruiter => {
        let value = 0;
        switch (metric) {
          case 'Submission-to-Client':
            value = recruiter.profiles_submitted > 0
              ? (recruiter.sent_to_client / recruiter.profiles_submitted) * 100
              : 0;
            break;
          case 'Client Acceptance':
            value = recruiter.sent_to_client > 0
              ? ((recruiter.interviews.technical + recruiter.interviews.l1 + recruiter.interviews.l2 + recruiter.interviews.end_client) / recruiter.sent_to_client) * 100
              : 0;
            break;
          case 'Technical Conversion':
            value = recruiter.interviews.technical > 0
              ? (recruiter.interviews.technical_selected / recruiter.interviews.technical) * 100
              : 0;
            break;
          case 'Technical→L1':
            value = recruiter.interviews.technical_selected > 0
              ? (recruiter.interviews.l1 / recruiter.interviews.technical_selected) * 100
              : 0;
            break;
          case 'L1→L1 Selected':
            value = recruiter.interviews.l1 > 0
              ? (recruiter.interviews.l1_selected / recruiter.interviews.l1) * 100
              : 0;
            break;
          case 'L1→L2 Conversion':
            value = recruiter.interviews.l1_selected > 0
              ? (recruiter.interviews.l2 / recruiter.interviews.l1_selected) * 100
              : 0;
            break;
          case 'L2→End Client':
            value = recruiter.interviews.l2 > 0
              ? (recruiter.interviews.end_client / recruiter.interviews.l2) * 100
              : 0;
            break;
          case 'Offer Acceptance':
            value = recruiter.offers.made > 0
              ? (recruiter.offers.accepted / recruiter.offers.made) * 100
              : 0;
            break;
          case 'Join Rate':
            value = recruiter.offers.accepted > 0
              ? (recruiter.joining.joined / recruiter.offers.accepted) * 100
              : 0;
            break;
          case 'Funnel Efficiency':
            value = recruiter.profiles_submitted > 0
              ? (recruiter.joining.joined / recruiter.profiles_submitted) * 100
              : 0;
            break;
        }
        result[recruiter.recruiter] = value;
      });

      return result;
    });

    return radarData;
  };

  // Generate heatmap chart data (unchanged)
  const getHeatmapData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 12 }, (_, i) => `${i + 9}:00`);

    return days.flatMap(day =>
      hours.map(hour => ({
        day,
        hour,
        value: Math.floor(Math.random() * (day === 'Saturday' || day === 'Sunday' ? 3 : 10))
      }))
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recruiter Performance Report</h1>
        <DateRangePickerField
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnelAnalysis">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="recruiters">Recruiter Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecruiterPerformanceTable data={data} />
            <FunnelChart
              data={getFunnelData()}
              title="Recruitment Funnel"
            />
          </div>
        </TabsContent>

        <TabsContent value="funnelAnalysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FunnelChart
              data={getFunnelData()}
              title="Recruitment Funnel"
            />
            <div className="grid grid-cols-1 gap-6">
              <PieChartComponent
                data={getOfferOutcomesData()}
                title="Offer Outcomes"
              />
              <PieChartComponent
                data={getJoiningOutcomesData()}
                title="Joining Outcomes"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recruiters">
          <RecruiterRadarChart
            data={getRadarData()}
            title="Recruiter Performance Comparison"
            recruiters={data.map(r => r.recruiter)}
            colors={COLORS}
          />
          <div className="mt-6">
            <RecruiterPerformanceTable data={data} />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <HeatmapChart
            data={getHeatmapData()}
            title="Weekly Submission Activity Patterns"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecruiterReportPage;