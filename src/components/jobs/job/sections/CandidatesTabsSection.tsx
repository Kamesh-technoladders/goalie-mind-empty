
import { useState } from "react"
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
  // candidates, 
  onAddCandidate 
}: CandidatesTabsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("all");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [candidates, setCandidates] = useState([]);


  // Calculate counts for each status category
  const newCount = candidates.filter(c => c.status === "New").length;
  const inReviewCount = candidates.filter(c => c.status === "InReview").length;
  const engagedCount = candidates.filter(c => c.status === "Engaged").length;
  const availableCount = candidates.filter(c => c.status === "Available").length;
  const offeredCount = candidates.filter(c => c.status === "Offered").length;
  const hiredCount = candidates.filter(c => c.status === "Hired").length;
  const rejectedCount = candidates.filter(c => c.status === "Rejected").length;

  // Also include the original status values for backward compatibility
  const screeningCount = candidates.filter(c => c.status === "Screening").length;
  const interviewingCount = candidates.filter(c => c.status === "Interviewing").length;
  const selectedCount = candidates.filter(c => c.status === "Selected").length;

  const fetchCandidates = async (jobId: string) => {
    try {
      const data = await getCandidatesForJob(jobId);
      setCandidates(data);
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
              All Candidates ({candidates.length})
            </TabsTrigger>
            <TabsTrigger 
              value="new" 
              onClick={() => setActiveTab("new")}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
            >
              New ({newCount + screeningCount})
            </TabsTrigger>
            <TabsTrigger 
              value="inReview" 
              onClick={() => setActiveTab("inReview")}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-muted"
            >
              In Review ({inReviewCount + interviewingCount})
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
              Hired ({hiredCount + selectedCount})
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
          <CandidatesList jobId={jobId} jobdescription={jobdescription} onAddCandidate={onAddCandidate}  onRefresh={() => fetchCandidates(id || '')} />
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="New" onAddCandidate={onAddCandidate} />
        </TabsContent>
        
        <TabsContent value="inReview" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="InReview" onAddCandidate={onAddCandidate} />
        </TabsContent>
        
        <TabsContent value="engaged" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="Engaged" onAddCandidate={onAddCandidate} />
        </TabsContent>
        
        <TabsContent value="available" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="Available" onAddCandidate={onAddCandidate} />
        </TabsContent>
        
        <TabsContent value="offered" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="Offered" onAddCandidate={onAddCandidate} />
        </TabsContent>
        
        <TabsContent value="hired" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="Hired" onAddCandidate={onAddCandidate} />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          <CandidatesList jobId={jobId} jobdescription={jobdescription} statusFilter="Rejected" onAddCandidate={onAddCandidate} />
        </TabsContent>
      </Tabs>

      {/*Job Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-4xl p-0">
          <StatusSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatesTabsSection;
