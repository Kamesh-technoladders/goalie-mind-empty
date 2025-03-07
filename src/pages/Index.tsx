
import React, { useState, useRef, useEffect } from "react";
import { FormContainer } from "@/components/employee/layout/FormContainer";
import { FormContent } from "@/components/employee/forms/FormContent";
import { DashboardView } from "@/components/employee/dashboard/DashboardView";
import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import { calculateProgress } from "@/utils/progressCalculator";
import { useParams, useNavigate } from "react-router-dom";
import { employeeService } from "@/services/employee/employee.service";
import { toast } from "sonner";

const Index = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(!!id);
  const [isLoading, setIsLoading] = useState(!!id);
  
  const {
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
  } = useEmployeeForm(id);
  
  const formRef = useRef<HTMLFormElement | null>(null);

  // Fetch employee data when editing an existing employee
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const data = await employeeService.getEmployee(id);
          if (data) {
            // Transform the employee data to match form structure
            const personalData = {
              employeeId: data.employee_id || '',
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              email: data.email || '',
              phone: data.phone || '',
              dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : new Date(),
              gender: data.gender || 'male',
              bloodGroup: data.blood_group || 'A+',
              maritalStatus: data.marital_status || 'unmarried',
              // Add other employee fields as needed
              presentAddress: data.present_address || {
                addressLine1: '',
                country: '',
                state: '',
                city: '',
                zipCode: ''
              },
              permanentAddress: data.permanent_address || {
                addressLine1: '',
                country: '',
                state: '',
                city: '',
                zipCode: ''
              },
              documents: [],
              emergencyContacts: [],
              familyDetails: []
            };
            
            // Update form data with fetched employee data
            updateFormData('personal', personalData);
            updateSectionProgress('personal', true);
          } else {
            toast.error("Employee not found");
            navigate("/employee");
          }
        } catch (error) {
          console.error("Error fetching employee:", error);
          toast.error("Error loading employee data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      fetchEmployeeData();
    }
  }, [id, navigate, updateFormData, updateSectionProgress]);

  const tabs = [
    { id: "personal", label: "Personal Details", isActive: activeTab === "personal" },
    { id: "education", label: "Education & Experience", isActive: activeTab === "education" },
    { id: "bank", label: "Bank Account Details", isActive: activeTab === "bank" },
  ];

  // Calculate progress percentage from the form state
  const progress = calculateProgress(formProgress);

  const handleAddEmployee = () => {
    navigate("/employee");
  };

  const handleFormClose = () => {
    navigate("/employee");
  };

  // Reset form and go back to dashboard when form is completed
  React.useEffect(() => {
    if (isFormCompleted) {
      navigate("/employee");
    }
  }, [isFormCompleted, navigate]);

  // If we're on the main dashboard view without an ID, redirect to employee page
  React.useEffect(() => {
    if (!id && !showForm) {
      navigate("/employee");
    }
  }, [id, showForm, navigate]);

  return (
    <>
      {showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{id ? "Edit Employee" : "Add New Employee"}</h1>
            <button
              onClick={handleFormClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <FormContainer
              tabs={tabs}
              onTabChange={handleTabChange}
              onSaveAndNext={handleSaveAndNext}
              activeTab={activeTab}
              formRef={formRef}
              isSubmitting={isSubmitting}
              onCancel={handleFormClose}
            >
              <FormContent
                activeTab={activeTab}
                formData={formData}
                updateSectionProgress={updateSectionProgress}
                updateFormData={updateFormData}
                isSubmitting={isSubmitting}
                isCheckingEmail={isCheckingEmail}
                emailError={emailError}
                formRef={formRef}
                handleSaveAndNext={handleSaveAndNext}
              />
            </FormContainer>
          )}
        </>
      ) : (
        <DashboardView onAddEmployee={handleAddEmployee} />
      )}
    </>
  );
};

export default Index;
