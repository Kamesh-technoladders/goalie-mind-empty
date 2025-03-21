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
import { createCandidate, updateCandidate, updateCandidateSkillRatings } from "@/services/candidateService";
import { useSelector } from "react-redux";
import { supabase } from "@/integrations/supabase/client";

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
  const user = useSelector((state: any) => state.auth.user);
  const isEditMode = !!candidate;

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
      console.log("Setting form values for candidate:", candidate);
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

      skillsForm.reset({
        skills: candidate.skill_ratings || candidate.skills || []
      });
    }
  }, [candidate, isEditMode, basicInfoForm, skillsForm]);

  const handleClose = () => {
    basicInfoForm.reset();
    skillsForm.reset();
    setCandidateId(isEditMode ? candidate?.id : null);
    setActiveTab("basic-info");
    controlledOnOpenChange(false);
  };

  const handleSaveBasicInfo = async (data: CandidateFormData) => {
    try {
      if (!job.id) {
        toast.error("Job ID is missing");
        return;
      }

      const updatedFrom = user?.user_metadata
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : candidate?.appliedFrom || "Unknown";

      const candidateData = {
        id: candidateId || "",
        name: `${data.firstName} ${data.lastName}`,
        status: isEditMode ? (candidate?.status || "Screening") : "Screening" as CandidateStatus,
        experience: `${data.totalExperience} years`,
        matchScore: isEditMode ? (candidate?.matchScore || 0) : 0,
        appliedDate: isEditMode ? (candidate?.appliedDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        skills: isEditMode ? (candidate?.skills || []) : [],
        email: data.email,
        phone: data.phone,
        currentSalary: data.currentSalary,
        expectedSalary: data.expectedSalary,
        location: data.currentLocation || candidate?.location || "",
        updatedFrom,
        resumeUrl: data.resume,
        metadata: {
          currentLocation: data.currentLocation,
          preferredLocations: data.preferredLocations,
          totalExperience: data.totalExperience,
          relevantExperience: data.relevantExperience,
          currentSalary: data.currentSalary,
          expectedSalary: data.expectedSalary,
          resume_url: data.resume,
        },
        skill_ratings: isEditMode ? (candidate?.skill_ratings || []) : []
      };

      console.log("Basic Info Payload:", candidateData);

      if (!candidateId || !isEditMode) {
        const newCandidate = await createCandidate(job.id, candidateData);
        setCandidateId(newCandidate.id);
        toast.success("Basic information saved successfully");
      } else {
        await updateCandidate(candidateId, candidateData);
        toast.success("Basic information updated successfully");
      }

      setActiveTab("skills-info");
    } catch (error) {
      console.error("Error saving candidate basic info:", error);
      toast.error("Failed to save basic information");
    }
  };

  const handleSaveSkills = async (data: CandidateFormData) => {
    try {
      if (!candidateId || !job.id) {
        toast.error("Candidate ID or Job ID is missing");
        return;
      }

      // Update skill ratings
      await updateCandidateSkillRatings(candidateId, data.skills);

      // Calculate match score
      const matchScore = calculateMatchScore(data.skills);

      // Fetch current candidate data to preserve existing fields
      const { data: currentCandidateData, error: fetchError } = await supabase
        .from('hr_job_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Prepare the full candidate object with updated skills and match score
      const updatedCandidateData = {
        ...currentCandidateData,
        match_score: matchScore,
      };

      console.log("Skills Save Payload:", updatedCandidateData);

      // Update the candidate with all preserved fields
      await updateCandidate(candidateId, updatedCandidateData);

      toast.success("Skills updated successfully");
      onCandidateAdded();
      handleClose();
    } catch (error) {
      console.error("Error saving candidate skills:", error);
      toast.error("Failed to save skills information");
    }
  };

  const calculateMatchScore = (skills: Array<{name: string, rating: number}>) => {
    if (skills.length === 0) return 0;
    const totalPossibleScore = skills.length * 5;
    const actualScore = skills.reduce((sum, skill) => sum + skill.rating, 0);
    return Math.round((actualScore / totalPossibleScore) * 100);
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
              disabled={!candidateId}
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
              jobSkills={job.skills || []}
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