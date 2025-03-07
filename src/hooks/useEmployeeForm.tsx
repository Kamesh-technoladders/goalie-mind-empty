
import { useState } from "react";
import { toast } from "sonner";
import { useEmailValidation } from "./form/useEmailValidation";
import { useFormState } from "./form/useFormState";

export const useEmployeeForm = () => {
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const {
    activeTab,
    formProgress,
    formData,
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    setActiveTab
  } = useFormState();

  const { isCheckingEmail, emailError } = useEmailValidation(formData.personal?.email);

  const handleSaveAndNext = async (completedData?: any) => {
    if (!completedData) {
      console.warn("No data provided to handleSaveAndNext");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Store the completed data for the current tab
      updateFormData(activeTab as any, completedData);
      updateSectionProgress(activeTab as any, true);
      
      // Move to next tab
      if (activeTab === "personal") {
        toast.success("Personal details saved successfully!");
        setActiveTab("education");
      } else if (activeTab === "education") {
        toast.success("Education details saved!");
        setActiveTab("bank");
      } else if (activeTab === "bank") {
        toast.success("Bank details saved! Employee profile complete.");
        setIsFormCompleted(true);
      }
    } catch (error) {
      console.error('Error in handleSaveAndNext:', error);
      toast.error("Error saving data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeTab,
    formProgress,
    formData,
    isFormCompleted,
    isSubmitting,
    isCheckingEmail,
    emailError,
    employeeId,
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    handleSaveAndNext,
    setEmployeeId
  };
};
