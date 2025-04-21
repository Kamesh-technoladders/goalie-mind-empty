import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileSpreadsheet,
  Files,
  ChevronUp,
  ChevronDown,
  User
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

interface DerivedMetric {
  name: string;
  formula: string;
  value: number;
  description: string;
}

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

interface RecruiterPerformanceTableProps {
  data: RecruiterPerformanceData[];
}

const RecruiterPerformanceTable: React.FC<RecruiterPerformanceTableProps> = ({ data }) => {
  const [sortColumn, setSortColumn] = useState<string>('recruiter');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any = a;
    let bValue: any = b;

    const parts = sortColumn.split('.');
    for (const part of parts) {
      aValue = aValue[part as keyof typeof aValue];
      bValue = bValue[part as keyof typeof bValue];
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Calculate derived metrics for each recruiter
  const calculateDerivedMetrics = (recruiter: RecruiterPerformanceData): DerivedMetric[] => {
    const totalInterviews = recruiter.interviews.technical +
      recruiter.interviews.technical_selected +
      recruiter.interviews.l1 +
      recruiter.interviews.l1_selected +
      recruiter.interviews.l2 +
      recruiter.interviews.end_client;

    return [
      {
        name: 'Submission-to-Client Ratio',
        formula: 'Sent to Client / Profiles Submitted',
        value: recruiter.profiles_submitted > 0
          ? recruiter.sent_to_client / recruiter.profiles_submitted
          : 0,
        description: 'Ratio of profiles sent to client vs total submitted'
      },
      {
        name: 'Client Acceptance Rate',
        formula: '(Interviews + Offers + Joins) / Sent to Client',
        value: recruiter.sent_to_client > 0
          ? (totalInterviews + recruiter.offers.made + recruiter.joining.joined) / recruiter.sent_to_client
          : 0,
        description: 'Percentage of client-submitted profiles that move forward'
      },
      {
        name: 'Interview Conversion Rate',
        formula: 'Total Interviews / Sent to Client',
        value: recruiter.sent_to_client > 0
          ? totalInterviews / recruiter.sent_to_client
          : 0,
        description: 'Percentage of client-submitted profiles that get interviews'
      },
      {
        name: 'Technical→L1 Conversion',
        formula: 'L1 / Technical Selected',
        value: recruiter.interviews.technical_selected > 0
          ? recruiter.interviews.l1 / recruiter.interviews.technical_selected
          : 0,
        description: 'Percentage of technical selected that progress to L1'
      },
      {
        name: 'L1→L2 Conversion',
        formula: 'L2 / L1 Selected',
        value: recruiter.interviews.l1_selected > 0
          ? recruiter.interviews.l2 / recruiter.interviews.l1_selected
          : 0,
        description: 'Percentage of L1 selected that progress to L2'
      },
      {
        name: 'L2→End Client',
        formula: 'End Client / L2',
        value: recruiter.interviews.l2 > 0
          ? recruiter.interviews.end_client / recruiter.interviews.l2
          : 0,
        description: 'Percentage of L2 interviews that progress to End Client'
      },
      {
        name: 'End Client→Offer',
        formula: 'Offer Made / End Client',
        value: recruiter.interviews.end_client > 0
          ? recruiter.offers.made / recruiter.interviews.end_client
          : 0,
        description: 'Percentage of End Client interviews that result in offers'
      },
      {
        name: 'Offer Acceptance Rate',
        formula: 'Offer Accepted / Offer Made',
        value: recruiter.offers.made > 0
          ? recruiter.offers.accepted / recruiter.offers.made
          : 0,
        description: 'Percentage of offers that are accepted'
      },
      {
        name: 'Join Rate',
        formula: 'Joined / Offer Accepted',
        value: recruiter.offers.accepted > 0
          ? recruiter.joining.joined / recruiter.offers.accepted
          : 0,
        description: 'Percentage of accepted offers that result in joining'
      },
      {
        name: 'Funnel Efficiency',
        formula: 'Joined / Profiles Submitted',
        value: recruiter.profiles_submitted > 0
          ? recruiter.joining.joined / recruiter.profiles_submitted
          : 0,
        description: 'Overall efficiency of the recruitment funnel'
      },
      {
        name: 'Client Reject Rate',
        formula: 'Client Reject / Sent to Client',
        value: recruiter.sent_to_client > 0
          ? recruiter.client_reject / recruiter.sent_to_client
          : 0,
        description: 'Percentage of client-submitted profiles rejected by client'
      }
    ];
  };

  // Export functions
  const exportToCSV = () => {
    let csv = 'Recruiter,Jobs Assigned,Profiles Submitted,Internal Reject,Client Reject,Sent to Client,Client Duplicate,';
    csv += 'Technical,Technical Selected,Technical Reject,L1,L1 Selected,L1 Reject,L2,L2 Reject,End Client,End Client Reject,';
    csv += 'Offers Made,Offers Accepted,Offers Rejected,Joined,No Show,';
    csv += 'Submission-to-Client Ratio,Client Acceptance Rate,Interview Conversion Rate,Technical→L1 Conversion,L1→L2 Conversion,L2→End Client,End Client→Offer,Offer Acceptance Rate,Join Rate,Funnel Efficiency,Client Reject Rate\n';

    data.forEach(recruiter => {
      const metrics = calculateDerivedMetrics(recruiter);

      csv += `${recruiter.recruiter},${recruiter.jobs_assigned},${recruiter.profiles_submitted},${recruiter.internal_reject},${recruiter.client_reject},${recruiter.sent_to_client},`;
      csv += `${recruiter.client_duplicate},`;
      csv += `${recruiter.interviews.technical},${recruiter.interviews.technical_selected},${recruiter.interviews.technical_reject},`;
      csv += `${recruiter.interviews.l1},${recruiter.interviews.l1_selected},${recruiter.interviews.l1_reject},`;
      csv += `${recruiter.interviews.l2},${recruiter.interviews.l2_reject},${recruiter.interviews.end_client},${recruiter.interviews.end_client_reject},`;
      csv += `${recruiter.offers.made},${recruiter.offers.accepted},${recruiter.offers.rejected},`;
      csv += `${recruiter.joining.joined},${recruiter.joining.no_show},`;

      metrics.forEach(metric => {
        csv += `${metric.value.toFixed(2)},`;
      });

      csv = csv.slice(0, -1) + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'recruiter_performance.csv');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(18);
    doc.text('Recruiter Performance Report', 14, 22);

    const tableData = data.map(recruiter => {
      const metrics = calculateDerivedMetrics(recruiter);

      return [
        recruiter.recruiter,
        recruiter.jobs_assigned.toString(),
        recruiter.profiles_submitted.toString(),
        recruiter.sent_to_client.toString(),
        `${recruiter.interviews.technical}/${recruiter.interviews.technical_reject}`,
        `${recruiter.interviews.l1}/${recruiter.interviews.l1_reject}`,
        `${recruiter.interviews.l2}/${recruiter.interviews.l2_reject}`,
        `${recruiter.interviews.end_client}/${recruiter.interviews.end_client_reject}`,
        `${recruiter.offers.made}/${recruiter.offers.accepted}`,
        `${recruiter.joining.joined}/${recruiter.joining.no_show}`,
        metrics[0].value.toFixed(2),
        metrics[1].value.toFixed(2),
        metrics[10].value.toFixed(2), // Client Reject Rate
        metrics[7].value.toFixed(2),
        metrics[9].value.toFixed(2)
      ];
    });

    const headers = [
      'Recruiter', 'Jobs', 'Submitted', 'To Client',
      'Tech (P/F)', 'L1 (P/F)', 'L2 (P/F)', 'EC (P/F)',
      'Offers (M/A)', 'Joined (J/NS)',
      'Sub Ratio', 'Client Acc', 'Client Rej', 'Offer Acc', 'Funnel Eff'
    ];

    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [240, 240, 249] }
    });

    doc.save('recruiter_performance.pdf');
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recruiter Performance Metrics</CardTitle>
            <CardDescription>Detailed breakdown of recruiter performance metrics across the recruitment funnel</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-1"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="flex items-center gap-1"
            >
              <Files className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('recruiter')}
                >
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Recruiter
                    {renderSortIndicator('recruiter')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('jobs_assigned')}
                >
                  <div className="flex items-center gap-1">
                    Jobs
                    {renderSortIndicator('jobs_assigned')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('profiles_submitted')}
                >
                  <div className="flex items-center gap-1">
                    Submitted
                    {renderSortIndicator('profiles_submitted')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('internal_reject')}
                >
                  <div className="flex items-center gap-1">
                    Int. Reject
                    {renderSortIndicator('internal_reject')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('client_reject')}
                >
                  <div className="flex items-center gap-1">
                    Client Rej.
                    {renderSortIndicator('client_reject')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('sent_to_client')}
                >
                  <div className="flex items-center gap-1">
                    To Client
                    {renderSortIndicator('sent_to_client')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('interviews.technical')}
                >
                  <div className="flex items-center gap-1">
                    Technical
                    {renderSortIndicator('interviews.technical')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('interviews.l1')}
                >
                  <div className="flex items-center gap-1">
                    L1 Int.
                    {renderSortIndicator('interviews.l1')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('interviews.l2')}
                >
                  <div className="flex items-center gap-1">
                    L2 Int.
                    {renderSortIndicator('interviews.l2')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('interviews.end_client')}
                >
                  <div className="flex items-center gap-1">
                    EC Int.
                    {renderSortIndicator('interviews.end_client')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('offers.made')}
                >
                  <div className="flex items-center gap-1">
                    Offers
                    {renderSortIndicator('offers.made')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('joining.joined')}
                >
                  <div className="flex items-center gap-1">
                    Joined
                    {renderSortIndicator('joining.joined')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Sub→Client</TableHead>
                <TableHead className="text-right">Client Accept</TableHead>
                <TableHead className="text-right">Client Rej. Rate</TableHead>
                <TableHead className="text-right">Tech→L1</TableHead>
                <TableHead className="text-right">Offer Accept</TableHead>
                <TableHead className="text-right">Funnel Eff.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((recruiter, index) => {
                const metrics = calculateDerivedMetrics(recruiter);

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{recruiter.recruiter}</TableCell>
                    <TableCell>{recruiter.jobs_assigned}</TableCell>
                    <TableCell>{recruiter.profiles_submitted}</TableCell>
                    <TableCell>{recruiter.internal_reject}</TableCell>
                    <TableCell>{recruiter.client_reject}</TableCell>
                    <TableCell>{recruiter.sent_to_client}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <span>{recruiter.interviews.technical}</span>
                          <span className="text-xs text-emerald-500">{recruiter.interviews.technical_selected} selected</span>
                          <span className="text-xs text-red-500">{recruiter.interviews.technical_reject} rejected</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <span>{recruiter.interviews.l1}</span>
                          <span className="text-xs text-emerald-500">{recruiter.interviews.l1_selected} selected</span>
                          <span className="text-xs text-red-500">{recruiter.interviews.l1_reject} rejected</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <span>{recruiter.interviews.l2}</span>
                          <span className="text-xs text-red-500">{recruiter.interviews.l2_reject} rejected</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <span>{recruiter.interviews.end_client}</span>
                          <span className="text-xs text-red-500">{recruiter.interviews.end_client_reject} rejected</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <span>{recruiter.offers.made}</span>
                          <span className="text-xs text-emerald-500">{recruiter.offers.accepted} accepted</span>
                          <span className="text-xs text-red-500">{recruiter.offers.rejected} rejected</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <span>{recruiter.joining.joined}</span>
                          <span className="text-xs text-red-500">{recruiter.joining.no_show} no-show</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(metrics[0].value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(metrics[1].value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(metrics[10].value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(metrics[3].value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(metrics[7].value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(metrics[9].value)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecruiterPerformanceTable;