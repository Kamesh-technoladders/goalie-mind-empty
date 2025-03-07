
import { useState } from "react";
import { toast } from "sonner";
import { useEmailValidation } from "./form/useEmailValidation";
import { useFormState } from "./form/useFormState";
import { useNavigate } from "react-router-dom";
import { PersonalDetailsData } from "@/components/employee/types";
import { employeeService } from "@/services/employee/employee.service";

export const useEmployeeForm = (employeeId?: string | null) => {
  const navigate = useNavigate();
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

  const { isCheckingEmail, emailError } = useEmailValidation(
    formData.personal && 'email' in formData.personal 
      ? formData.personal.email as string 
      : ""
  );

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
      
      // If we're updating an existing employee
      if (employeeId) {
        try {
          // Save the data to the database based on the current section
          if (activeTab === "personal") {
            await employeeService.updateEmployee(employeeId, {
              first_name: completedData.firstName,
              last_name: completedData.lastName,
              email: completedData.email,
              phone: completedData.phone,
              date_of_birth: completedData.dateOfBirth,
              gender: completedData.gender,
              blood_group: completedData.bloodGroup,
              marital_status: completedData.maritalStatus,
              employee_id: completedData.employeeId,
              // Add other fields as needed
            });
            toast.success("Personal details updated successfully!");
            setActiveTab("education");
          } else if (activeTab === "education") {
            // Handle education update
            toast.success("Education details updated!");
            setActiveTab("bank");
          } else if (activeTab === "bank") {
            // Handle bank details update
            toast.success("Bank details updated! Employee profile updated.");
            setIsFormCompleted(true);
            // Navigate back to employee list after form completion
            setTimeout(() => {
              navigate("/employee");
            }, 1500);
          }
        } catch (error) {
          console.error("Error updating employee:", error);
          toast.error("Error updating employee data");
        }
      } else {
        // Creating a new employee (existing logic)
        if (activeTab === "personal") {
          toast.success("Personal details saved successfully!");
          setActiveTab("education");
        } else if (activeTab === "education") {
          toast.success("Education details saved!");
          setActiveTab("bank");
        } else if (activeTab === "bank") {
          toast.success("Bank details saved! Employee profile complete.");
          setIsFormCompleted(true);
          // Navigate back to employee list after form completion
          setTimeout(() => {
            navigate("/employee");
          }, 1500);
        }
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
    handleSaveAndNext
  };
};
