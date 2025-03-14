import React from "react";
import { Progress } from "../ui/progress";

interface ProgressStatsProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  onLeaveCount?: number; // ✅ Make this optional
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({ 
  totalCount,
  activeCount,
  inactiveCount,
  onLeaveCount = 0 // ✅ Default value to 0
}) => {
  const calculatePercentage = (count: number): number => {
    if (totalCount === 0) return 0;
    return (count / totalCount) * 100;
  };

  return (
    <div className="grid grid-cols-3 gap-6"> {/* ✅ Removed one column */}
      <div className="progress-card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-brand-secondary">Total Projects</span>
          <span className="text-sm font-bold">{totalCount}</span>
        </div>
        <Progress value={100} className="h-2 bg-gray-100" />
      </div>
      
      <div className="progress-card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-brand-secondary">Ongoing</span>
          <span className="text-sm font-bold">{activeCount}</span>
        </div>
        <Progress 
          value={calculatePercentage(activeCount)} 
          className="h-2 bg-gray-100" 
        />
      </div>
      
      <div className="progress-card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-brand-secondary">Completed</span>
          <span className="text-sm font-bold">{inactiveCount}</span>
        </div>
        <Progress 
          value={calculatePercentage(inactiveCount)} 
          className="h-2 bg-gray-100" 
        />
      </div>
    </div>
  );
};
