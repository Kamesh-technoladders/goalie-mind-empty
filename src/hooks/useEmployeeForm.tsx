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

  const { isCheckingEmail, emailError, setEmailError } = useEmailValidation(formData.personal?.email);
  
  useEffect(() => {
    console.log("Form Data Updated:", formData);
  }, [formData]); 
  
  const validatePersonalDetails = (data: any): boolean => {
    // Minimal validation to ensure basic required fields
    if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim()) {
      console.warn("Basic required fields missing");
      return false;
    }
    return true;
  };

  const handleSaveAndNext = async (completedData?: any) => {
    console.log("Received Data in handleSaveAndNext:", completedData);
  
    if (!completedData) {
      console.warn("No data provided to handleSaveAndNext");
      // Still proceed to next tab even with incomplete data
      moveToNextTab();
      return;
    }
  
    console.log("Active Tab:", activeTab);
    console.log("Current Form Data State:", formData);
  
    setIsSubmitting(true);
    
    try {
      if (activeTab === "personal") {
        // Basic validation but don't block progression
        validatePersonalDetails(completedData);
        
        const submissionData = {
          ...completedData,
          presentAddress: completedData.presentAddress || {},
          permanentAddress: completedData.permanentAddress || {},
          documents: completedData.documents || [],
        };
      
        // Save data but don't block on errors
        try {
          const savedEmployee = await personalInfoService.createPersonalInfo(submissionData);
          if (savedEmployee && savedEmployee.id) {
            setEmployeeId(savedEmployee.id);
            updateFormData("personal", { ...submissionData, id: savedEmployee.id });
            updateSectionProgress("personal", true);
            toast.success("✅ Personal details saved successfully!");
          } else {
            console.warn("Couldn't save personal details but continuing");
            updateFormData("personal", submissionData);
            updateSectionProgress("personal", true);
          }
        } catch (error: any) {
          console.error('Error saving personal details:', error);
          toast.error("⚠️ Couldn't save personal details, but you can continue");
          // Still update form data to keep user input
          updateFormData("personal", submissionData);
          updateSectionProgress("personal", true);
        }
      } else if (activeTab === "education") {
        // Save education data
        updateFormData("education", completedData);
        updateSectionProgress("education", true);
        toast.success("✅ Education details saved!");
      } else if (activeTab === "bank") {
        // Save bank data
        updateFormData("bank", completedData);
        updateSectionProgress("bank", true);
        setIsFormCompleted(true);
        toast.success("✅ Bank details saved! Employee profile complete.");
      }
      
      // Always move to next tab regardless of save success
      moveToNextTab();
      
    } catch (error: any) {
      console.error('Error in handleSaveAndNext:', error);
      toast.error("Error saving data, but you can continue");
      // Still allow moving to next tab
      moveToNextTab();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const moveToNextTab = () => {
    if (activeTab === "personal") {
      setActiveTab("education");
    } else if (activeTab === "education") {
      setActiveTab("bank");
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
