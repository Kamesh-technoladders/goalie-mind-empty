
import React, { useState, useRef } from "react";
import { FormContainer } from "@/components/employee/layout/FormContainer";
import { FormContent } from "@/components/employee/forms/FormContent";
import { DashboardView } from "@/components/employee/dashboard/DashboardView";
import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import { calculateProgress } from "@/utils/progressCalculator";
import { useParams, useNavigate } from "react-router-dom";

const Index = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(!!id);
  
  const {
    activeTab,
    formProgress,
    formData,
    isFormCompleted,
    isSubmitting,
    updateSectionProgress,
    updateFormData,
    handleTabChange,
    handleSaveAndNext,
  } = useEmployeeForm(id);
  
  const formRef = useRef<HTMLFormElement | null>(null);

  const tabs = [
    { id: "personal", label: "Personal Details", isActive: activeTab === "personal" },
    { id: "education", label: "Education & Experience", isActive: activeTab === "education" },
    { id: "bank", label: "Bank Account Details", isActive: activeTab === "bank" },
  ];

  const progress = calculateProgress(formProgress);

  const handleAddEmployee = () => {
    // This button is not needed as we're using the modal from Employee page
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
              formRef={formRef}
              handleSaveAndNext={handleSaveAndNext}
            />
          </FormContainer>
        </>
      ) : (
        <DashboardView onAddEmployee={handleAddEmployee} />
      )}
    </>
  );
};

export default Index;
