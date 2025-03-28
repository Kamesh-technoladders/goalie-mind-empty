
import React, { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Progress } from "./types/candidate.types";
import { fetchAllStatuses } from "@/services/statusService";
import { toast } from "sonner";

// Define types for status objects
export interface MainStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  display_order?: number;
  type: 'main';
  subStatuses?: SubStatus[];
}

export interface SubStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  display_order?: number;
  type: 'sub';
  parent_id: string;
}

interface ProgressColumnProps {
  progress?: Progress;
  currentStatus?: string;
  mainStatus?: Partial<MainStatus> | null;
  subStatus?: Partial<SubStatus> | null;
}

// Get color for a stage based on status data
const getStageColor = (
  stageName: string, 
  mainStatus?: Partial<MainStatus> | null
): string => {
  if (mainStatus?.name === stageName && mainStatus?.color) {
    return mainStatus.color;
  }
  
  // Default colors if no custom color is provided
  const defaultColors: Record<string, string> = {
    'Screening': '#1E88E5',
    'Interview': '#E65100',
    'Offer': '#FFA000',
    'Hired': '#00897B',
    'Joined': '#2E7D32',
    'Rejected': '#D32F2F',
    'Not Started': '#9CA3AF'
  };
  
  return defaultColors[stageName] || '#9CA3AF';
};

export const ProgressColumn = ({ 
  progress, 
  currentStatus, 
  mainStatus, 
  subStatus 
}: ProgressColumnProps) => {
  const [allStatuses, setAllStatuses] = useState<MainStatus[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all statuses from the database
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        setLoading(true);
        const data = await fetchAllStatuses();
        // Sort by display_order to ensure correct sequence
        const sortedData = data.sort((a, b) => 
          (a.display_order || 0) - (b.display_order || 0)
        );
        setAllStatuses(sortedData);
      } catch (error) {
        console.error("Error loading statuses:", error);
        toast.error("Failed to load status information");
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
  }, []);
  
  // Determine the current stage based on available data
  const getCurrentStage = (): string => {
    // If we have explicit main status, use that
    if (mainStatus?.name) {
      return mainStatus.name;
    }
    
    // Otherwise, determine from progress
    if (progress) {
      // Check each standard progress field in order
      const progressFields = ['joined', 'hired', 'offer', 'interview', 'screening'];
      for (const field of progressFields) {
        if (progress[field as keyof Progress]) {
          // Convert field name to proper stage name (capitalize first letter)
          return field.charAt(0).toUpperCase() + field.slice(1);
        }
      }
    }
    
    // Default if no data
    return 'Not Started';
  };
  
  const currentStage = getCurrentStage();

  // Format the display status text
  const getStatusDisplayText = (): string => {
    if (mainStatus && subStatus) {
      return `${mainStatus.name} (${subStatus.name})`;
    } else if (currentStatus) {
      return currentStatus;
    }
    return currentStage;
  };
  
  // Determine if a specific stage should be colored based on current progress
  const shouldColorStage = (stageName: string): boolean => {
    if (!mainStatus) {
      // If no main status is provided, use progress
      if (progress) {
        return allStatuses.findIndex(s => s.name === stageName) <= 
               allStatuses.findIndex(s => s.name === getCurrentStage());
      }
      return false;
    }
    
    // Find the index of the current main status in our stages array
    const currentMainStatusIndex = allStatuses.findIndex(s => s.name === mainStatus.name);
    const stageIndex = allStatuses.findIndex(s => s.name === stageName);
    
    // If the stage is before or equal to the current main status, it should be colored
    return stageIndex <= currentMainStatusIndex;
  };
  
  // If still loading statuses, show minimal indicator
  if (loading) {
    return <div className="h-6 flex items-center"><div className="w-20 h-1 bg-gray-200 rounded animate-pulse"></div></div>;
  }

  // If no statuses are available, show a fallback
  if (allStatuses.length === 0) {
    return <div className="text-sm text-gray-500">Status information unavailable</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        {allStatuses.map((stage, index) => {
          // Check if this stage corresponds to the current main status
          const isCurrentMainStage = mainStatus?.name === stage.name;
          // Check if this stage should be colored based on progress
          const shouldColor = shouldColorStage(stage.name);
          
          // Get custom color from status if available
          const customColor = isCurrentMainStage && mainStatus?.color 
            ? `bg-[${mainStatus.color}]` 
            : `bg-[${getStageColor(stage.name, mainStatus)}]`;

          return (
            <React.Fragment key={stage.id}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative cursor-pointer transition-all duration-150">
                      <div
                        className={`h-1 w-2.5 rounded-sm transition-all ${
                          shouldColor ? customColor : "bg-gray-200"
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
                        {stage.name}
                        {currentStage === stage.name && " (Current)"}
                      </div>
                      {stage.subStatuses && stage.subStatuses.length > 0 && (
                        <div className="text-gray-500 mt-1">
                          <div className="text-[10px] uppercase font-semibold mb-0.5">Sub-statuses:</div>
                          <ul className="list-disc list-inside">
                            {stage.subStatuses.map(sub => (
                              <li key={sub.id} className="ml-1">
                                {sub.name}
                                {subStatus?.id === sub.id && " (Current)"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {index < allStatuses.length - 1 && (
                <div className={`h-px w-1 ${
                  shouldColor && shouldColorStage(allStatuses[index + 1].name)
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
            backgroundColor: mainStatus?.color || getStageColor(currentStage)
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
