import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { JobData, CandidateStatus, Candidate } from "@/lib/types";
import BasicInformationTab from "./BasicInformationTab";
import SkillInformationTab from "./SkillInformationTab";
import { createCandidate, updateCandidate, updateCandidateSkillRatings, eidtCandidate, editCandidate } from "@/services/candidateService";
import { useSelector } from "react-redux";
import { supabase } from "@/integrations/supabase/client";
import { getJobById } from "@/services/jobService";
import { useQuery } from "@tanstack/react-query";

interface AddCandidateDrawerProps {
  job: JobData;
  onCandidateAdded: () => void;
  candidate?: Candidate;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type CandidateFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentLocation: string;
  preferredLocations: string[];
  totalExperience: number;
  relevantExperience: number;
  experience?: string;
  resume: string | null;
  skills: Array<{
    name: string;
    rating: number;
  }>;
  location?: string;
  expectedSalary?: number;
  currentSalary?: number;
};

const AddCandidateDrawer = ({ job, onCandidateAdded, candidate, open, onOpenChange }: AddCandidateDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [candidateId, setCandidateId] = useState<string | null>(candidate?.id || null);
  const [localCandidateData, setLocalCandidateData] = useState<CandidateFormData | null>(null);
  const user = useSelector((state: any) => state.auth.user);
  const isEditMode = !!candidate;

  // Fetch job data
  const { 
    data: jobs, 
    isLoading: jobLoading, 
    error: jobError,
    refetch: refetchJob
  } = useQuery({
    queryKey: ['job', job.id],
    queryFn: () => getJobById(job.id || ""),
    enabled: !!job.id,
  });

  const controlledOpen = open !== undefined ? open : isOpen;
  const controlledOnOpenChange = onOpenChange || setIsOpen;

  const basicInfoForm = useForm<CandidateFormData>({
    defaultValues: candidate && isEditMode ? {
      firstName: candidate.name.split(" ")[0] || "",
      lastName: candidate.name.split(" ").slice(1).join(" ") || "",
      email: candidate.email || "",
      phone: candidate.phone || "",
      currentLocation: candidate.metadata?.currentLocation || candidate.location || "",
      preferredLocations: candidate.metadata?.preferredLocations || [],
      totalExperience: candidate.metadata?.totalExperience 
        ? parseFloat(String(candidate.metadata.totalExperience)) 
        : candidate.experience 
          ? parseFloat(candidate.experience.replace(" years", "")) 
          : 0,
      relevantExperience: candidate.metadata?.relevantExperience 
        ? parseFloat(String(candidate.metadata.relevantExperience)) 
        : 0,
      currentSalary: candidate.currentSalary || 0,
      expectedSalary: candidate.expectedSalary || 0,
      resume: candidate.resume || "",
      skills: candidate.skill_ratings || candidate.skills || []
    } : {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      currentLocation: "",
      preferredLocations: [],
      totalExperience: 0,
      relevantExperience: 0,
      currentSalary: 0,
      expectedSalary: 0,
      resume: null,
      skills: []
    }
  });

  const skillsForm = useForm<CandidateFormData>({
    defaultValues: {
      skills: candidate && isEditMode 
        ? (candidate.skill_ratings || candidate.skills || [])
        : (job.skills?.map(skill => ({ name: skill, rating: 3 })) || [])
    }
  });

  useEffect(() => {
    if (candidate && isEditMode) {
      setCandidateId(candidate.id);
      basicInfoForm.reset({
        firstName: candidate.name.split(" ")[0] || "",
        lastName: candidate.name.split(" ").slice(1).join(" ") || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        currentLocation: candidate.metadata?.currentLocation || candidate.location || "",
        preferredLocations: candidate.metadata?.preferredLocations || [],
        totalExperience: candidate.metadata?.totalExperience 
          ? parseFloat(String(candidate.metadata.totalExperience)) 
          : candidate.experience 
            ? parseFloat(candidate.experience.replace(" years", "")) 
            : 0,
        relevantExperience: candidate.metadata?.relevantExperience 
          ? parseFloat(String(candidate.metadata.relevantExperience)) 
          : 0,
        currentSalary: candidate.currentSalary || 0,
        expectedSalary: candidate.expectedSalary || 0,
        resume: candidate.resume || "",
        skills: candidate.skill_ratings || candidate.skills || []
      });

      // Fallback to job skills if candidate skills are empty
      if (!candidate.skills || candidate.skills.length === 0) {
        const defaultSkills = jobs?.skills?.map(skill => ({ name: skill, rating: 0 })) || [];
        skillsForm.reset({ skills: defaultSkills });
      } else {
        skillsForm.reset({ skills: candidate.skill_ratings || candidate.skills || [] });
      }
    }
  }, [candidate, isEditMode, basicInfoForm, skillsForm, jobs]);

  const handleClose = () => {
    basicInfoForm.reset();
    skillsForm.reset();
    setCandidateId(isEditMode ? candidate?.id : null);
    setLocalCandidateData(null);
    setActiveTab("basic-info");
    controlledOnOpenChange(false);
  };

  const handleSaveBasicInfo = async (data: CandidateFormData) => {
    try {
      // Save data locally without persisting
      setLocalCandidateData(data);
      setActiveTab("skills-info");
      toast.success("Basic information saved locally");
    } catch (error) {
      console.error("Error saving candidate basic info:", error);
      toast.error("Failed to save basic information");
    }
  };

  const handleSaveSkills = async (data: CandidateFormData) => {
    try {
      if (!job.id) {
        toast.error("Job ID is missing");
        return;
      }
  
      // Use local candidate data if available
      const candidateData = localCandidateData || basicInfoForm.getValues();
  
      // Ensure skill_ratings is populated
      const skillsToSave = data.skills.length > 0 ? data.skills : [];
  
      const updatedFrom = user?.user_metadata
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : candidate?.appliedFrom || "Unknown";
  
      const payload: CandidateData = {
        id: candidateId || "",
        name: `${candidateData.firstName} ${candidateData.lastName}`,
        status: isEditMode ? (candidate?.status || "Screening") : "Screening",
        experience: `${candidateData.totalExperience} years`,
        matchScore: isEditMode ? (candidate?.matchScore || 0) : 0,
        appliedDate: isEditMode ? (candidate?.appliedDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        skills: skillsToSave.map(skill => JSON.stringify(skill)), // Convert to string array
        email: candidateData.email,
        phone: candidateData.phone,
        currentSalary: candidateData.currentSalary,
        expectedSalary: candidateData.expectedSalary,
        location: candidateData.currentLocation || candidate?.location || "",
        resumeUrl: candidateData.resume,
        metadata: {
          currentLocation: candidateData.currentLocation,
          preferredLocations: candidateData.preferredLocations,
          totalExperience: candidateData.totalExperience,
          relevantExperience: candidateData.relevantExperience,
          currentSalary: candidateData.currentSalary,
          expectedSalary: candidateData.expectedSalary,
          resume_url: candidateData.resume,
        },
        skillRatings: skillsToSave, // Explicitly set skillRatings
      };
  
      if (!candidateId || !isEditMode) {
        const newCandidate = await createCandidate(job.id, payload);
        setCandidateId(newCandidate.id);
        toast.success("Candidate created successfully");
      } else {
        await editCandidate(candidateId, payload);
        toast.success("Candidate updated successfully");
      }
  
      onCandidateAdded();
      handleClose();
    } catch (error) {
      console.error("Error saving candidate skills:", error);
      toast.error("Failed to save candidate information");
    }
  };

  return (
    <Sheet open={controlledOpen} onOpenChange={controlledOnOpenChange}>
      <SheetTrigger asChild>
        <Button 
          id={isEditMode ? "edit-candidate-btn" : "add-candidate-btn"} 
          onClick={() => controlledOnOpenChange(true)}
        >
          {isEditMode ? "Edit Candidate" : "Add Candidate"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditMode ? "Edit Candidate" : "Add New Candidate"}</SheetTitle>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
            <TabsTrigger 
              value="skills-info" 
              disabled={!localCandidateData && !isEditMode}
            >
              Skill Information
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic-info">
            <BasicInformationTab 
              form={basicInfoForm} 
              onSaveAndNext={(data) => handleSaveBasicInfo(data)}
              onCancel={handleClose}
            />
          </TabsContent>
          
          <TabsContent value="skills-info">
            <SkillInformationTab 
              form={skillsForm}
              jobSkills={jobs?.skills || []}
              onSave={(data) => handleSaveSkills(data)}
              onCancel={handleClose}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default AddCandidateDrawer;