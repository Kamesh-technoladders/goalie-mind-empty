
import { useState } from "react";
import { FormProgress, FormData } from "@/utils/progressCalculator";
import { toast } from "sonner";

export const useFormState = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [formProgress, setFormProgress] = useState<FormProgress>({
    personal: false,
    education: false,
    experience: false,
    bank: false,
  });

  const [formData, setFormData] = useState<FormData>({
    personal: {
      documents: [],
      emergencyContacts: [],
      familyDetails: []
    },
    education: null,
    experience: [],
    bank: null,
  });

  // Simplified update functions
  const updateSectionProgress = (section: keyof FormProgress, completed: boolean) => {
    setFormProgress(prev => ({
      ...prev,
      [section]: completed,
    }));
  };

  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data,
    }));
  };

  // Simplified tab change with minimal validation
  const handleTabChange = (tabId: string) => {
    // Only validate when leaving personal tab which is required
    if (activeTab === "personal" && !formProgress.personal) {
      toast.error("Please save the personal details before proceeding");
      return;
    }
    setActiveTab(tabId);
  };

  return {
    activeTab,
    formProgress,
    formData,
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    setActiveTab
  };
};
