
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import CandidatesList from "../CandidatesList";
import { Candidate, CandidateStatus } from "@/lib/types";
import StatusSettings from "@/pages/jobs/StatusSettings";
import { getCandidatesForJob, createDummyCandidate } from "@/services/candidatesService";
import { fetchAllStatuses, MainStatus, SubStatus } from "@/services/statusService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CandidatesTabsSectionProps {
  jobId: string;
  jobdescription: string;
  candidates: Candidate[];
  onAddCandidate: () => void;
}

// Interface for Filter State
interface StatusFilter {
  id: string;
  name: string;
  isMain: boolean;
  selected: boolean;
  color?: string;
}

const CandidatesTabsSection = ({ 
  jobId, 
  jobdescription,
  candidates,
  onAddCandidate 
}: CandidatesTabsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("all");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [localCandidates, setLocalCandidates] = useState<Candidate[]>([]);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [allStatuses, setAllStatuses] = useState<MainStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  // Load statuses for filter options and tabs
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        setLoading(true);
        const data = await fetchAllStatuses();
        setAllStatuses(data);
        
        // Create filter options from main statuses and sub-statuses
        const filterOptions: StatusFilter[] = [];
        
        // Add main statuses
        data.forEach(mainStatus => {
          filterOptions.push({
            id: mainStatus.id,
            name: mainStatus.name,
            isMain: true,
            selected: false,
            color: mainStatus.color
          });
          
          // Add sub-statuses
          if (mainStatus.subStatuses && mainStatus.subStatuses.length > 0) {
            mainStatus.subStatuses.forEach(subStatus => {
              filterOptions.push({
                id: subStatus.id,
                name: `${mainStatus.name} - ${subStatus.name}`,
                isMain: false,
                selected: false,
                color: subStatus.color || mainStatus.color
              });
            });
          }
        });
        
        setStatusFilters(filterOptions);
      } catch (error) {
        console.error("Error loading statuses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStatuses();
  }, []);

  // Set local candidates from props
  useEffect(() => {
    if (candidates.length > 0) {
      setLocalCandidates(candidates);
    }
  }, [candidates]);

  // Calculate counts for each status category
  const getStatusCount = (statusId: string) => {
    if (statusId === "all") {
      return localCandidates.length;
    }
    
    if (statusId === "career-page") {
      return localCandidates.filter(c => 
        c.appliedFrom === "Candidate"
      ).length;
    }
    
    // Check for both main and sub-statuses if applicable
    const count = localCandidates.filter(c => 
      c.main_status_id === statusId || c.sub_status_id === statusId
    ).length;
  
    console.log(`Count for status ${statusId}: ${count}`); // Debugging line
    console.log(`Checking count for status ID: ${statusId}`); // Debugging line
    return count;
  };

  const fetchCandidates = async () => {
    try {
      const data = await getCandidatesForJob(jobId);
      if (data) {
        setLocalCandidates(data);
      }
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      toast.error(`Error fetching candidates: ${error.message}`);
    }
  };

  // Toggle filter selection
  const toggleFilter = (id: string) => {
    setStatusFilters(prev => 
      prev.map(filter => 
        filter.id === id 
          ? { ...filter, selected: !filter.selected }
          : filter
      )
    );
  };

  // Apply filters
  const applyFilters = () => {
    const selectedFilters = statusFilters
      .filter(filter => filter.selected)
      .map(filter => filter.id);
    
    setAppliedFilters(selectedFilters);
    setShowFilterDialog(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilters(prev => 
      prev.map(filter => ({ ...filter, selected: false }))
    );
    setAppliedFilters([]);
    setShowFilterDialog(false);
  };

  // Remove a specific filter
  const removeFilter = (id: string) => {
    setStatusFilters(prev => 
      prev.map(filter => 
        filter.id === id 
          ? { ...filter, selected: false }
          : filter
      )
    );
    setAppliedFilters(prev => prev.filter(filterId => filterId !== id));
  };

  // Get the name of a filter by its ID
  const getFilterNameById = (id: string): StatusFilter | undefined => {
    return statusFilters.find(filter => filter.id === id);
  };

  return (
    <div className="md:col-span-3">
      <Tabs defaultValue="all" className="w-full">
        <div className="border-b mb-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent p-0 flex flex-wrap">
              <TabsTrigger 
                value="all" 
                onClick={() => setActiveTab("all")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                All Candidates ({getStatusCount("all")})
              </TabsTrigger>
              
              {/* Dynamically generate tabs based on main statuses */}
              {allStatuses.map(status => (
                <TabsTrigger 
                  key={status.id}
                  value={status.id} 
                  onClick={() => setActiveTab(status.id)}
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
                  style={{
                    borderColor: activeTab === status.id ? status.color : 'transparent',
                    color: activeTab === status.id ? status.color : undefined
                  }}
                >
                  {status.name} ({getStatusCount(status.id)})
                </TabsTrigger>
              ))}
              
            </TabsList>
            <div className="flex items-center gap-2 ml-4">
              {/* Filter Button */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDialog(true)}
                className="flex items-center gap-1"
              >
                <Filter size={16} />
                <span className="ml-1">Filter</span>
              </Button>
              
              {/* Status Settings Button */}
              <Button 
                onClick={() => setShowStatusDialog(true)}
                size="sm"
              >
                Status Settings
              </Button>
            </div>
          </div>
          
          {/* Display applied filters */}
          {appliedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {appliedFilters.map(filterId => {
                const filter = getFilterNameById(filterId);
                if (!filter) return null;
                
                return (
                  <Badge 
                    key={filterId} 
                    variant="secondary" 
                    className="flex items-center gap-1 py-1"
                    style={{
                      backgroundColor: filter.color ? `${filter.color}20` : undefined,
                      borderColor: filter.color || undefined,
                      color: filter.color || undefined
                    }}
                  >
                    {filter.name}
                    <button 
                      onClick={() => removeFilter(filterId)}
                      className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                );
              })}
              
              {appliedFilters.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-6 text-xs px-2"
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* All candidates tab */}
        <TabsContent value="all" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        {/* Career Page tab */}
        <TabsContent value="career-page" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
            isCareerPage={true}
          />
        </TabsContent>
        
        {/* Dynamically generate tab content for each main status */}
        {allStatuses.map(status => (
          <TabsContent key={status.id} value={status.id} className="mt-0">
            <CandidatesList 
              jobId={jobId} 
              jobdescription={jobdescription} 
              statusFilter={status.name}
              onAddCandidate={onAddCandidate} 
              onRefresh={fetchCandidates}
              statusFilters={appliedFilters}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/*Job Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-4xl p-0">
          <StatusSettings onStatusChange={fetchCandidates} />
        </DialogContent>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <h2 className="text-xl font-semibold mb-4">Filter Candidates</h2>
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                statusFilters.map(filter => (
                  <div key={filter.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={filter.id}
                      checked={filter.selected}
                      onCheckedChange={() => toggleFilter(filter.id)}
                    />
                    <label 
                      htmlFor={filter.id} 
                      className={`text-sm ${filter.isMain ? 'font-medium' : 'ml-2'}`}
                      style={{ color: filter.color || undefined }}
                    >
                      {filter.name}
                    </label>
                    {filter.color && (
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: filter.color }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatesTabsSection;
