
import { useState } from "react";
import { FormProgress, FormData } from "@/utils/progressCalculator";
import { toast } from "sonner";
import { EmergencyContact, FamilyMember } from "@/components/employee/types";

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
      emergencyContacts: [] as EmergencyContact[],
      familyDetails: [] as FamilyMember[],
      // Add these fields to satisfy the PersonalDetailsData type
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      employeeId: "",
      gender: "male", // Default value that matches the enum
      bloodGroup: "A+", // Default value that matches the enum
      maritalStatus: "unmarried", // Default value that matches the enum
      presentAddress: {
        addressLine1: "",
        country: "",
        state: "",
        city: "",
        zipCode: ""
      },
      permanentAddress: {
        addressLine1: "",
        country: "",
        state: "",
        city: "",
        zipCode: ""
      },
      sameAsPresent: false
    },
    education: null,
    experience: [],
    bank: null,
  });

  const updateSectionProgress = (section: keyof FormProgress, completed: boolean) => {
    console.log(`Updating ${section} progress:`, completed);
    setFormProgress((prev) => ({
      ...prev,
      [section]: completed,
    }));
  };

  const updateFormData = (section: keyof FormData, data: any) => {
    console.log(`Updating ${section} data:`, data);
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleTabChange = (tabId: string) => {
    const currentTabKey = activeTab as keyof FormProgress;
    if (!formProgress[currentTabKey]) {
      toast.error("Please save the current section before proceeding");
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
