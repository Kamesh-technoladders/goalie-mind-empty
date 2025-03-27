
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CandidatesList from "../CandidatesList";
import { Candidate, CandidateStatus } from "@/lib/types";
import StatusSettings from "@/pages/jobs/StatusSettings";
import { getCandidatesForJob, createDummyCandidate } from "@/services/candidatesService";
import { toast } from "sonner";

interface CandidatesTabsSectionProps {
  jobId: string;
  jobdescription: string;
  candidates: Candidate[];
  onAddCandidate: () => void;
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
      setLocalCandidates(data);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      toast.error(`Error fetching candidates: ${error.message}`);
    }
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
            <Button 
                onClick={() => setShowStatusDialog(true)}
                className="ml-4"
              >
                Status Settings
              </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="New" 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="inReview" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="InReview" 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="engaged" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Engaged" 
            onAddCandidate={onAddCandidate} 
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="available" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Available" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="offered" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Offered" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="hired" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Hired" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          <CandidatesList 
            jobId={jobId} 
            jobdescription={jobdescription} 
            statusFilter="Rejected" 
            onAddCandidate={onAddCandidate}
            onRefresh={fetchCandidates} 
          />
        </TabsContent>
      </Tabs>

      {/*Job Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-4xl p-0">
          <StatusSettings onStatusChange={fetchCandidates} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatesTabsSection;
