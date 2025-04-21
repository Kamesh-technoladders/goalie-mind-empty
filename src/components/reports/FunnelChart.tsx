
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelChartProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
  title: string;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, title }) => {
  // Sort data from highest to lowest value for the funnel effect
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            layout="vertical"
            data={sortedData}
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}`, 'Count']}
              labelFormatter={(label) => `Stage: ${label}`}
            />
            <Bar 
              dataKey="value" 
              barSize={30}
              radius={[0, 6, 6, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList 
                dataKey="value" 
                position="insideRight"
                fill="#ffffff"
                formatter={(value) => value}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FunnelChart;
