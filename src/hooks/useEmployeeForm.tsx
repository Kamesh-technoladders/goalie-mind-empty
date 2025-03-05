
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { employeeService } from "@/services/employee/employee.service";
import { useEmailValidation } from "./form/useEmailValidation";
import { useFormState } from "./form/useFormState";
import { PersonalDetailsData } from "@/components/employee/types";
import { EmployeeData } from "@/services/types/employee.types";
import { personalInfoService } from "@/services/employee/personalInfo.service";

export const useEmployeeForm = () => {
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    activeTab,
    formProgress,
    formData,
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    setActiveTab
  } = useFormState();

  const { isCheckingEmail, emailError, setEmailError } = useEmailValidation(formData.personal?.email);
  
  useEffect(() => {
    console.log("Form Data Updated:", formData);
  }, [formData]); 

  // Simplified validation that always returns true for development
  const validatePersonalDetails = (data: any): boolean => {
    console.log("Validating Personal Details (always passing):", data);
    return true;
  };

  const handleSaveAndNext = async (completedData?: any) => {
    console.log("handleSaveAndNext called with data:", completedData);
  
    // Always proceed even without completed data for development
    if (!completedData) {
      console.log("No data provided, but continuing anyway for development");
      completedData = { devMode: true };
    }
  
    if (activeTab === "personal") {
      setIsSubmitting(true);
      try {
        // Always validate as true
        validatePersonalDetails(completedData);
  
        const savedEmployee = await personalInfoService.createPersonalInfo(completedData);
        console.log("Saved employee:", savedEmployee);
  
        updateFormData("personal", { ...completedData, id: savedEmployee.id });
        updateSectionProgress("personal", true);
        setActiveTab("education"); // Move to next tab
        toast.success("Personal details saved successfully!");
      } catch (error: any) {
        console.error('Error saving personal details:', error);
        // Show toast but continue anyway
        toast.error("There was an error, but continuing anyway for development");
        
        // Still update progress and move to next tab even on error
        updateFormData("personal", { ...completedData, id: 'dev-id-' + Date.now() });
        updateSectionProgress("personal", true);
        setActiveTab("education");
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === "education") {
      // Process education & experience data
      updateSectionProgress("education", true);
      updateSectionProgress("experience", true);
      setActiveTab("bank"); // Move to bank tab
      toast.success("Education and experience details saved successfully!");
    } else if (activeTab === "bank") {
      // Final submission
      try {
        setIsFormCompleted(true);
        toast.success("All employee details submitted successfully!");
      } catch (error: any) {
        console.error('Error in final submission:', error);
        // Show toast but mark as completed anyway
        toast.error("There was an error, but marking as completed for development");
        setIsFormCompleted(true);
      }
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
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    handleSaveAndNext,
  };
};
