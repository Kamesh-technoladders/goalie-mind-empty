
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

  // Simplified validation to only check critical fields
  const validatePersonalDetails = (data: any): boolean => {
    console.log("Validating Personal Details:", data);
    
    if (!data.firstName?.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!data.lastName?.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!data.email?.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!data.phone?.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    
    return true;
  };

  const handleSaveAndNext = async (completedData?: any) => {
    console.log("handleSaveAndNext called with data:", completedData);
  
    if (!completedData) {
      toast.error("Please complete all required fields before proceeding.");
      return;
    }
  
    if (activeTab === "personal") {
      setIsSubmitting(true);
      try {
        if (!validatePersonalDetails(completedData)) {
          setIsSubmitting(false);
          return;
        }
  
        const savedEmployee = await personalInfoService.createPersonalInfo(completedData);
        if (!savedEmployee) throw new Error("Failed to save personal details");
  
        updateFormData("personal", { ...completedData, id: savedEmployee.id });
        updateSectionProgress("personal", true);
        setActiveTab("education"); // Move to next tab
        toast.success("Personal details saved successfully!");
      } catch (error: any) {
        console.error('Error saving personal details:', error);
        toast.error(error.message || "Failed to save personal details.");
        updateSectionProgress("personal", false);
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
        toast.error(error.message || "Failed to complete submission.");
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
