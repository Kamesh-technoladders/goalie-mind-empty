
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormContainer } from "@/components/employee/layout/FormContainer";
import { FormContent } from "@/components/employee/forms/FormContent";
import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(!!id);
  const formRef = useRef(null);
  
  const {
    activeTab,
    formProgress,
    formData,
    isSubmitting,
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    handleSaveAndNext,
  } = useEmployeeForm(id);

  useEffect(() => {
    if (id) {
      // If we have an ID, we're editing an existing employee
      fetchEmployeeData(id);
    }
  }, [id]);

  const fetchEmployeeData = async (employeeId) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Transform data for the form
        const personalData = {
          id: data.id,
          employeeId: data.employee_id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          bloodGroup: data.blood_group,
          maritalStatus: data.marital_status,
          documents: []
        };
        
        // Update form data
        updateFormData("personal", personalData);
        updateSectionProgress("personal", true);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load employee data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Details", isActive: activeTab === "personal" },
    { id: "education", label: "Education & Experience", isActive: activeTab === "education" },
    { id: "bank", label: "Bank Account Details", isActive: activeTab === "bank" },
  ];

  const handleGoBack = () => {
    navigate("/employee");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoBack}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
        <h1 className="text-2xl font-bold">Edit Employee</h1>
      </div>

      <FormContainer
        tabs={tabs}
        onTabChange={handleTabChange}
        onSaveAndNext={handleSaveAndNext}
        activeTab={activeTab}
        formRef={formRef}
        isSubmitting={isSubmitting}
        onCancel={handleGoBack}
      >
        <FormContent
          activeTab={activeTab}
          formData={formData}
          updateSectionProgress={updateSectionProgress}
          updateFormData={updateFormData}
          isSubmitting={isSubmitting}
          formRef={formRef}
          handleSaveAndNext={handleSaveAndNext}
        />
      </FormContainer>
    </div>
  );
};

export default EditEmployee;
