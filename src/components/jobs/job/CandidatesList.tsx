import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCandidatesByJobId, updateCandidateStatus } from "@/services/candidateService";
import { Candidate, CandidateStatus } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/jobs/ui/table";
import StatusSelector from "./candidate/StatusSelector";
import ValidateResumeButton from "./candidate/ValidateResumeButton";
import ActionButtons from "./candidate/ActionButtons";
import StageProgress from "./candidate/StageProgress";
import EmptyState from "./candidate/EmptyState";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditCandidateDrawer from "@/components/jobs/job/candidate/EditCandidateDrawer"; // Import EditCandidateDrawer

interface CandidatesListProps {
  jobId: string;
  statusFilter?: string;
  onAddCandidate?: () => void;
}

const CandidatesList = ({ jobId, statusFilter, onAddCandidate }: CandidatesListProps) => {
  const { data: candidatesData = [], isLoading, refetch } = useQuery({
    queryKey: ['job-candidates', jobId],
    queryFn: () => getCandidatesByJobId(jobId),
  });

  // State for edit drawer
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Recruitment stages
  const recruitmentStages = ["New", "InReview", "Engaged", "Available", "Offered", "Hired"];

  // Convert CandidateData to Candidate type with additional fields for UI
  const candidates: Candidate[] = candidatesData.map(candidate => {
    let statusValue: CandidateStatus = "New";
    
    if (candidate.status === "Screening") statusValue = "New";
    else if (candidate.status === "Interviewing") statusValue = "InReview";
    else if (candidate.status === "Selected") statusValue = "Hired";
    else if (candidate.status === "Rejected") statusValue = "Rejected";
    else statusValue = candidate.status as CandidateStatus;

    const stageIndex = recruitmentStages.indexOf(statusValue);
    const currentStage = statusValue === "Rejected" ? "Rejected" : recruitmentStages[stageIndex >= 0 ? stageIndex : 0];
    
    return {
      id: candidate.id,
      name: candidate.name,
      status: statusValue,
      experience: candidate.experience || "",
      matchScore: candidate.matchScore || 0,
      appliedDate: candidate.appliedDate,
      skills: candidate.skillRatings || candidate.skills || [],
      email: candidate.email,
      phone: candidate.phone,
      resume: candidate.resumeUrl,
      appliedFrom: candidate.appliedFrom,
      currentSalary: candidate.currentSalary,
      expectedSalary: candidate.expectedSalary,
      location: candidate.location,
      metadata: candidate.metadata,
      skill_ratings: candidate.skillRatings,
      currentStage,
      completedStages: recruitmentStages.slice(0, stageIndex),
      hasValidatedResume: Math.random() > 0.5  // Replace with actual data if available
    };
  });

  const filteredCandidates = statusFilter 
    ? candidates.filter(c => c.status === statusFilter)
    : candidates;

  const handleStatusChange = async (candidateId: number, newStatus: CandidateStatus) => {
    try {
      await updateCandidateStatus(candidateId.toString(), newStatus);
      toast.success(`Candidate status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update candidate status");
      console.error("Error updating status:", error);
    }
  };

  const handleValidateResume = async (candidateId: number) => {
    try {
      const candidateIndex = filteredCandidates.findIndex(c => c.id === candidateId);
      if (candidateIndex !== -1) {
        filteredCandidates[candidateIndex].hasValidatedResume = true;
        toast.success("Resume validated successfully!");
        refetch();
      }
    } catch (error) {
      toast.error("Failed to validate resume");
      console.error("Validation error:", error);
    }
  };

  const handleViewResume = (candidateId: number) => {
    const candidate = filteredCandidates.find(c => c.id === candidateId);
    if (candidate?.resume) {
      window.open(candidate.resume, "_blank");
    } else {
      toast.error("Resume not available");
    }
  };

  const handleScheduleInterview = (candidateId: number) => {
    toast.info("Schedule interview clicked");
  };

  const handleViewProfile = (candidateId: number) => {
    toast.info("View profile clicked");
  };

  const handleCall = (candidateId: number) => {
    toast.info("Call candidate clicked");
  };

  const handleEditCandidate = (candidate: Candidate) => {
    console.log("Editing candidate:", candidate);
    setSelectedCandidate(candidate);
    setIsEditDrawerOpen(true);
  };

  const handleCandidateUpdated = () => {
    setIsEditDrawerOpen(false);
    setSelectedCandidate(null);
    refetch();
    toast.success("Candidate updated successfully");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredCandidates.length === 0) {
    return <EmptyState onAddCandidate={onAddCandidate || (() => {})} />;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Candidate Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Stage Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-center">Validated</TableHead>
              <TableHead className="text-right">Action</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{candidate.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Applied on {candidate.appliedDate}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{candidate.appliedFrom}</TableCell>
                <TableCell>{candidate.profit}</TableCell>
                <TableCell>
                  <div className="w-28">
                    <StageProgress 
                      stages={recruitmentStages}
                      currentStage={candidate.currentStage || "New"}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <StatusSelector 
                    status={candidate.status}
                    candidateId={candidate.id}
                    onStatusChange={handleStatusChange}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <ValidateResumeButton 
                    isValidated={candidate.hasValidatedResume || false}
                    candidateId={candidate.id}
                    onValidate={handleValidateResume}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <ActionButtons 
                    candidateId={candidate.id}
                    onViewResume={handleViewResume}
                    onScheduleInterview={handleScheduleInterview}
                    onViewProfile={handleViewProfile}
                    onCall={handleCall}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCandidate(candidate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Candidate Drawer */}
      {selectedCandidate && (
        <EditCandidateDrawer
          job={{ id: jobId, skills: selectedCandidate.skills.map(s => typeof s === 'string' ? s : s.name) } as any}
          onCandidateAdded={handleCandidateUpdated}
          candidate={selectedCandidate}
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
        />
      )}
    </>
  );
};

export default CandidatesList;