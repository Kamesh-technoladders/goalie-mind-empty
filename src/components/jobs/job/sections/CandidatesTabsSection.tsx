
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

  // Load statuses for filter options
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
            selected: false
          });
          
          // Add sub-statuses
          if (mainStatus.subStatuses && mainStatus.subStatuses.length > 0) {
            mainStatus.subStatuses.forEach(subStatus => {
              filterOptions.push({
                id: subStatus.id,
                name: `${mainStatus.name} - ${subStatus.name}`,
                isMain: false,
                selected: false
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
  const getStatusCount = (status: string) => {
    return localCandidates.filter(c => 
      c.status === status || 
      (c.main_status && c.main_status.name === status)
    ).length;
  };

  const newCount = getStatusCount("New") + getStatusCount("Screening");
  const inReviewCount = getStatusCount("InReview") + getStatusCount("Interviewing");
  const engagedCount = getStatusCount("Engaged");
  const availableCount = getStatusCount("Available");
  const offeredCount = getStatusCount("Offered");
  const hiredCount = getStatusCount("Hired") + getStatusCount("Selected");
  const rejectedCount = getStatusCount("Rejected");

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
                All Candidates ({localCandidates.length})
              </TabsTrigger>
              <TabsTrigger 
                value="new" 
                onClick={() => setActiveTab("new")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                New ({newCount})
              </TabsTrigger>
              <TabsTrigger 
                value="inReview" 
                onClick={() => setActiveTab("inReview")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                In Review ({inReviewCount})
              </TabsTrigger>
              <TabsTrigger 
                value="engaged" 
                onClick={() => setActiveTab("engaged")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                Engaged ({engagedCount})
              </TabsTrigger>
              <TabsTrigger 
                value="available" 
                onClick={() => setActiveTab("available")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                Available ({availableCount})
              </TabsTrigger>
              <TabsTrigger 
                value="offered" 
                onClick={() => setActiveTab("offered")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                Offered ({offeredCount})
              </TabsTrigger>
              <TabsTrigger 
                value="hired" 
                onClick={() => setActiveTab("hired")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                Hired ({hiredCount})
              </TabsTrigger>
              <TabsTrigger 
                value="rejected" 
                onClick={() => setActiveTab("rejected")}
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
              >
                Rejected ({rejectedCount})
              </TabsTrigger>
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
                const filter = statusFilters.find(f => f.id === filterId);
                if (!filter) return null;
                
                return (
                  <Badge key={filterId} variant="secondary" className="flex items-center gap-1 py-1">
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
        
        <TabsContent value="all" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="New" 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="inReview" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="InReview" 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="engaged" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Engaged" 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="available" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Available" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="offered" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Offered" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="hired" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Hired" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Rejected" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates}
            statusFilters={appliedFilters}
          />
        </TabsContent>
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
                    >
                      {filter.name}
                    </label>
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
