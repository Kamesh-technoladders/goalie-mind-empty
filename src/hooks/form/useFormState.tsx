
import { useState } from "react";
import { FormProgress, FormData } from "@/utils/progressCalculator";
import { toast } from "sonner";
import { PersonalDetailsData } from "@/components/employee/types";

export type TabTypes = 'personal' | 'education' | 'experience' | 'bank';

export const useFormState = () => {
  const [activeTab, setActiveTab] = useState<TabTypes>("personal");
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

  // Update functions with proper typing
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

  // Tab change with minimal validation
  const handleTabChange = (tabId: string) => {
    // Only prevent navigation if we're at personal tab and trying to move without data
    if (activeTab === "personal" && !formProgress.personal && tabId !== "personal") {
      toast.error("Please complete personal details first");
      return;
    }
    setActiveTab(tabId as TabTypes);
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
