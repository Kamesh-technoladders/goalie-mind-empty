
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Progress } from "./types/candidate.types";
import { MainStatus, SubStatus } from "@/services/statusService";

interface ProgressColumnProps {
  progress?: Progress;
  currentStatus?: string;
  mainStatus?: Partial<MainStatus> | null;
  subStatus?: Partial<SubStatus> | null;
}

// Helper functions to get color and status information
const getDummyStageColor = (stageLabel: string) => {
  const stageColors: Record<string, string> = {
    'Screening': '#1E88E5',
    'Interview': '#E65100',
    'Offer': '#FFA000',
    'Hired': '#00897B',
    'Joined': '#2E7D32',
    'Not Started': '#9CA3AF'
  };
  
  return stageColors[stageLabel] || '#9CA3AF';
};

export const ProgressColumn = ({ 
  progress, 
  currentStatus, 
  mainStatus, 
  subStatus 
}: ProgressColumnProps) => {
  const stages = [
    { key: 'screening', label: 'Screening', color: 'bg-blue-500' },
    { key: 'interview', label: 'Interview', color: 'bg-yellow-500' },
    { key: 'offer', label: 'Offer', color: 'bg-orange-500' },
    { key: 'hired', label: 'Hired', color: 'bg-green-500' },
    { key: 'joined', label: 'Joined', color: 'bg-emerald-700' }
  ] as const;
  
  const getCurrentStage = () => {
    // If we have explicit main status, use that
    if (mainStatus?.name) {
      return mainStatus.name;
    }
    
    // Otherwise, determine from progress
    for (let i = stages.length - 1; i >= 0; i--) {
      if (progress[stages[i].key]) {
        return stages[i].label;
      }
    }
    return 'Not Started';
  };
  
  const currentStage = getCurrentStage();

  // Format the display status text
  const getStatusDisplayText = () => {
    if (mainStatus && subStatus) {
      return `${mainStatus.name} (${subStatus.name})`;
    } else if (currentStatus) {
      return currentStatus;
    }
    return currentStage;
  };
  
  // NEW: Determine if a stage should be colored based on the current main status
  const shouldColorStage = (stageIndex: number) => {
    if (!mainStatus) return false;
    
    // Find the index of the current main status in our stages array
    const currentMainStatusIndex = stages.findIndex(stage => 
      stage.label === mainStatus.name
    );
    
    // If the stage is before or equal to the current main status, it should be colored
    return stageIndex <= currentMainStatusIndex;
  };
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        {stages.map((stage, index) => {
          // Check if this stage corresponds to the current main status
          const isCurrentMainStage = mainStatus?.name === stage.label;
          // NEW: Check if this stage should be colored based on progress
          const shouldColor = shouldColorStage(index);

          return (
            <React.Fragment key={stage.key}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative cursor-pointer transition-all duration-150">
                      <div
                        className={`h-1 w-2.5 rounded-sm transition-all ${
                          progress[stage.key] || isCurrentMainStage || shouldColor
                            ? `${stage.color}`
                            : "bg-gray-200"
                        } hover:opacity-80`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-white border shadow-md p-2 rounded-md"
                    sideOffset={4}
                  >
                    <div className="text-xs whitespace-nowrap">
                      <div className="font-medium pb-1 border-b border-gray-100 mb-1.5">
                        {stage.label}
                        {currentStage === stage.label && " (Current)"}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {index < stages.length - 1 && (
                <div className={`h-px w-1 ${
                  (progress[stage.key] && progress[stages[index + 1].key]) || 
                  (shouldColor && shouldColorStage(index + 1))
                    ? "bg-gray-400"
                    : "bg-gray-200"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Current Stage Indicator */}
      <div className="flex items-center gap-1.5">
        <div 
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
          style={{
            backgroundColor: mainStatus?.color || getDummyStageColor(currentStage)
          }}
        />
        <span className="text-xs text-gray-600">
          <span className="font-medium">
            {getStatusDisplayText()}
          </span>
          {(currentStatus && !mainStatus) && (
            <>
              <span className="mx-1 text-gray-400">•</span>
              <span className="text-gray-500">{currentStatus}</span>
            </>
          )}
          <span className="ml-1 text-gray-500">(Current)</span>
        </span>
      </div>
    </div>
  );
};
