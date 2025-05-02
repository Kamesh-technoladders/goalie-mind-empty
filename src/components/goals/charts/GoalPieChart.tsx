
import React from "react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface GoalPieChartProps {
  data: ChartDataItem[];
}

const GoalPieChart: React.FC<GoalPieChartProps> = ({ data }) => {
  // Filter out items with zero value to avoid empty slices
  const filteredData = data.filter(item => item.value > 0);
  
  // If no data with values, show empty state
  if (filteredData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No goal data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`${value} goals`, name]}
            contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GoalPieChart;
export { GoalPieChart as PieChart };
