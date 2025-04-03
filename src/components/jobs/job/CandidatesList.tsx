import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { getCandidatesByJobId } from "@/services/candidateService";
import { Candidate, CandidateStatus } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/jobs/ui/table";
import { StatusSelector } from "./StatusSelector";
import ValidateResumeButton from "./candidate/ValidateResumeButton";
import StageProgress from "./candidate/StageProgress";
import EmptyState from "./candidate/EmptyState";
import { Pencil, Eye, Download, FileText, Phone, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditCandidateDrawer from "@/components/jobs/job/candidate/EditCandidateDrawer";
import { getJobById } from "@/services/jobService";
import { ProgressColumn } from "./ProgressColumn";
import { Candidates } from "./types/candidate.types";
import { getCandidatesForJob, createDummyCandidate } from "@/services/candidatesService";
import { updateCandidateStatus } from "@/services/statusService";
import SummaryModal from "./SummaryModal";
import { supabase } from "@/integrations/supabase/client";
import { updateCandidateValidationStatus } from "@/services/candidateService";

interface CandidatesListProps {
  jobId: string;
  jobdescription: string;
  statusFilter?: string;
  statusFilters?: string[];
  onAddCandidate?: () => void;
  onRefresh: () => Promise<void>;
}

const CandidatesList = ({
  jobId,
  statusFilter,
  statusFilters = [],
  onAddCandidate,
  jobdescription,
  onRefresh,
}: CandidatesListProps) => {
  const user = useSelector((state: any) => state.auth.user);
  const organizationId = useSelector((state: any) => state.auth.organization_id);

  const { data: candidatesData = [], isLoading, refetch } = useQuery({
    queryKey: ["job-candidates", jobId],
    queryFn: () => getCandidatesByJobId(jobId),
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [candidateAnalysisData, setCandidateAnalysisData] = useState<{ [key: number]: any }>({});
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [analysisDataAvailable, setAnalysisDataAvailable] = useState<{
    [key: number]: boolean;
  }>({});

  console.log("filtered resumes", filteredCandidates);

  const {
    data: job,
    isLoading: jobLoading,
    refetch: refetchJob,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobById(jobId || ""),
    enabled: !!jobId,
  });

  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const recruitmentStages = ["New", "InReview", "Engaged", "Available", "Offered", "Hired"];

  useEffect(() => {
    const checkAnalysisData = async () => {
      const { data, error } = await supabase
        .from("hr_job_candidates")
        .select("candidate_id, overall_summary, overall_score")
        .eq("job_id", jobId)
        .not("overall_summary", "is", null);

      if (error) {
        console.error("Error checking analysis data:", error);
        return;
      }

      const availableData: { [key: number]: boolean } = {};
      const analysisDataTemp: { [key: number]: any } = {};
      data.forEach((item) => {
        availableData[item.candidate_id] = true;
        analysisDataTemp[item.candidate_id] = { overall_score: item.overall_score };
      });

      setAnalysisDataAvailable(availableData);
      setCandidateAnalysisData((prev) => ({ ...prev, ...analysisDataTemp }));
    };

    checkAnalysisData();
  }, [jobId]);

  const fetchAnalysisData = async (candidateId: number) => {
    try {
      const { data, error } = await supabase
        .from("hr_job_candidates")
        .select(`
          overall_score,
          skills_score,
          skills_summary,
          skills_enhancement_tips,
          work_experience_score,
          work_experience_summary,
          work_experience_enhancement_tips,
          projects_score,
          projects_summary,
          projects_enhancement_tips,
          education_score,
          education_summary,
          education_enhancement_tips,
          overall_summary,
          report_url
        `)
        .eq("job_id", jobId)
        .eq("candidate_id", candidateId)
        .single();

      if (error) throw error;

      setAnalysisData(data);
      setCandidateAnalysisData((prev) => ({
        ...prev,
        [candidateId]: data,
      }));
      setAnalysisDataAvailable((prev) => ({
        ...prev,
        [candidateId]: true,
      }));
      setIsSummaryModalOpen(true);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
      toast.error("Failed to fetch candidate analysis.");
      setAnalysisDataAvailable((prev) => ({
        ...prev,
        [candidateId]: false,
      }));
    }
  };

  useEffect(() => {
    if (candidatesData.length > 0) {
      const transformedCandidates: Candidate[] = candidatesData.map((candidate) => {
        let statusValue: CandidateStatus = candidate.status as CandidateStatus || "New";

        if (candidate.status === "Screening") statusValue = "New";
        else if (candidate.status === "Interviewing") statusValue = "InReview";
        else if (candidate.status === "Selected") statusValue = "Hired";

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
          hasValidatedResume: candidate.hasValidatedResume || false,
          progress: {
            screening: stageIndex >= 0,
            interview: stageIndex >= 1,
            offer: stageIndex >= 2,
            hired: stageIndex >= 3,
            joined: stageIndex >= 4,
          },
          main_status: candidate.main_status,
          sub_status: candidate.sub_status,
          main_status_id: candidate.main_status_id,
          sub_status_id: candidate.sub_status_id,
        };
      });

      setCandidates(transformedCandidates);
    }
  }, [candidatesData]);

  useEffect(() => {
    let filtered = [...candidates];

    if (statusFilter) {
      filtered = filtered.filter((c) => {
        if (c.main_status && c.main_status.name === statusFilter) {
          return true;
        }
        if (c.status === statusFilter) {
          return true;
        }
        return false;
      });
    }

    if (statusFilters && statusFilters.length > 0) {
      filtered = filtered.filter((candidate) => {
        if (statusFilters.length === 0) return true;
        if (candidate.main_status_id && statusFilters.includes(candidate.main_status_id)) {
          return true;
        }
        if (candidate.sub_status_id && statusFilters.includes(candidate.sub_status_id)) {
          return true;
        }
        return false;
      });
    }

    setFilteredCandidates(filtered);
  }, [candidates, statusFilter, statusFilters]);

  const handleStatusChange = async (value: string, candidate: Candidate) => {
    try {
      if (!candidate || !candidate.id) {
        toast.error("Invalid candidate data");
        return;
      }

      const success = await updateCandidateStatus(candidate.id, value, user?.id);

      if (success) {
        toast.success("Status updated successfully");
        await onRefresh();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  
  const handleValidateResume = async (candidateId: number) => {
    try {
      setValidatingId(candidateId);
      const candidate = filteredCandidates.find((c) => c.id === candidateId);
      if (!candidate) return;
  
      const resumeUrlParts = candidate.resume.split("candidate_resumes/");
      const extractedResumeUrl = resumeUrlParts.length > 1 ? resumeUrlParts[1] : candidate.resume;
  
      const payload = {
        job_id: jobId,
        candidate_id: candidateId.toString(),
        resume_url: extractedResumeUrl,
        job_description: jobdescription,
      };
  
      console.log("Backend data", payload);
  
      const response = await fetch("http://62.72.51.159:5005/api/validate-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Validation failed");
      }
  
      // Update the backend with has_validated_resume = true
      await updateCandidateValidationStatus(candidateId.toString());
  
      // Refetch the candidates data to reflect the updated status
      await refetch();
  
      // Update local state (optional, since refetch will handle it)
      const candidateIndex = filteredCandidates.findIndex((c) => c.id === candidateId);
      if (candidateIndex !== -1) {
        filteredCandidates[candidateIndex].hasValidatedResume = true;
        setFilteredCandidates([...filteredCandidates]);
        setAnalysisDataAvailable((prev) => ({
          ...prev,
          [candidateId]: true,
        }));
        toast.success("Resume validated successfully!");
        await fetchAnalysisData(candidateId);
      }
    } catch (error) {
      toast.error("Failed to validate resume");
      console.error("Validation error:", error);
    } finally {
      setValidatingId(null);
    }
  };

  const handleViewResume = (candidateId: number) => {
    const candidate = filteredCandidates.find((c) => c.id === candidateId);
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

  if (isLoading || jobLoading) {
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
              <TableHead className="w-[100px]">Validate</TableHead>
              <TableHead className="w-[60px]">Action</TableHead>
              {/* <TableHead className="w-[50px]"></TableHead> */}
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
                <TableCell>{candidate.profit || "N/A"}</TableCell>
                <TableCell>
                  <div className="truncate">
                    <ProgressColumn
                      progress={candidate.progress}
                      mainStatus={candidate.main_status}
                      subStatus={candidate.sub_status}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate max-w-[120px]">
                    <StatusSelector
                      value={candidate.sub_status_id || ""}
                      onChange={(value: string) => handleStatusChange(value, candidate)}
                      className="h-7 text-xs w-full"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <ValidateResumeButton
                    isValidated={candidate.hasValidatedResume || false}
                    candidateId={candidate.id}
                    onValidate={handleValidateResume}
                    isLoading={validatingId === candidate.id}
                    overallScore={candidateAnalysisData[candidate.id]?.overall_score}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-start">
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(candidate.id)}
                      title="View Profile"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleScheduleInterview(candidate.id)}
                      title="Schedule Interview"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCall(candidate.id)}
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewResume(candidate.id)}
                      title="View Resume"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (candidate.resume) {
                          const link = document.createElement('a');
                          link.href = candidate.resume;
                          link.download = `${candidate.name}_resume.pdf`;
                          link.click();
                        } else {
                          toast.error("Resume not available for download");
                        }
                      }}
                      title="Download Resume"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCandidate(candidate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                    {analysisDataAvailable[candidate.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchAnalysisData(candidate.id)}
                        title="View Summary Report"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                {/* <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCandidate(candidate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCandidate && (
        <EditCandidateDrawer
          job={{
            id: jobId,
            skills: selectedCandidate.skills.map((s) => (typeof s === "string" ? s : s.name)),
            organization_id: organizationId,
          } as any}
          onCandidateAdded={handleCandidateUpdated}
          candidate={selectedCandidate}
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
        />
      )}

      {isSummaryModalOpen && analysisData && (
        <SummaryModal
          analysisData={analysisData}
          onClose={() => setIsSummaryModalOpen(false)}
        />
      )}
    </>
  );
};

export default CandidatesList;

// 