import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonSelector } from './ComparisonSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ComparisonChartProps {
  data: any[];
  type: 'status' | 'employee';
  items: Array<{ id: string; name: string }>;
  selectedFirst: string;
  selectedSecond: string;
  onFirstChange: (value: string) => void;
  onSecondChange: (value: string) => void;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  type,
  items,
  selectedFirst,
  selectedSecond,
  onFirstChange,
  onSecondChange,
}) => {
  if (!selectedFirst || !selectedSecond) {
    return (
      <Alert>
        <AlertDescription>Please select both {type}s to compare.</AlertDescription>
      </Alert>
    );
  }

  if (!data.some(d => d[selectedFirst] !== undefined || d[selectedSecond] !== undefined)) {
    return (
      <Alert>
        <AlertDescription>No data available for the selected {type}s.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Comparison View</span>
          <div className="flex gap-4">
            <ComparisonSelector
              type={type}
              items={items}
              value={selectedFirst}
              onChange={onFirstChange}
              label={`First ${type}`}
            />
            <ComparisonSelector
              type={type}
              items={items}
              value={selectedSecond}
              onChange={onSecondChange}
              label={`Second ${type}`}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={selectedFirst}
              fill="#1e90ff"
              name={items.find(item => item.id === selectedFirst)?.name}
            />
            <Bar
              dataKey={selectedSecond}
              fill="#f97316"
              name={items.find(item => item.id === selectedSecond)?.name}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};