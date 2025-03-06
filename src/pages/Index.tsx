
import React, { useState, useRef, MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormContainer } from "@/components/employee/forms/FormContainer";
import { FormContent } from "@/components/employee/forms/FormContent";
import { useFormState } from "@/hooks/form/useFormState";
import { FormProgress, FormData } from "@/utils/progressCalculator";
import { PersonalDetailsData } from "@/components/employee/types";

// Import these hooks or create them if they don't exist
const useCheckEmail = () => ({
  isCheckingEmail: false,
  emailError: null,
  checkEmail: async () => {}
});

const useCheckPhone = () => ({
  isCheckingPhone: false,
  phoneError: null,
  checkPhone: async () => {}
});

const Index = () => {
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { activeTab, formProgress, formData, updateSectionProgress, updateFormData, handleTabChange, setActiveTab } = useFormState();
  const { isCheckingEmail, emailError, checkEmail } = useCheckEmail();
  const { isCheckingPhone, phoneError, checkPhone } = useCheckPhone();

  const tabs = [
    { id: "personal", label: "Personal Details", isActive: activeTab === "personal" },
    { id: "education", label: "Education & Experience", isActive: activeTab === "education" },
    { id: "bank", label: "Bank Account Details", isActive: activeTab === "bank" },
  ];

  const handleSaveAndNext = async (completedData?: any) => {
    setIsSubmitting(true);
    try {
      // Simulate saving data (replace with actual save logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Saved data:", completedData);

      // Move to the next tab
      const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (currentTabIndex < tabs.length - 1) {
        setActiveTab(tabs[currentTabIndex + 1].id);
      } else {
        // Optionally navigate to a different page if it's the last tab
        navigate("/employee-list");
      }
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Employee Onboarding Form</h1>

      <FormContainer
        tabs={tabs}
        onTabChange={handleTabChange}
        onSaveAndNext={handleSaveAndNext}
        activeTab={activeTab}
        formRef={formRef}
        formData={formData} // Pass the formData properly now
      >
        <FormContent 
          activeTab={activeTab} 
          formData={formData} 
          updateSectionProgress={updateSectionProgress}
          updateFormData={updateFormData}
          formRef={formRef}
          isCheckingEmail={isCheckingEmail}
          emailError={emailError}
          isSubmitting={isSubmitting}
          handleSaveAndNext={handleSaveAndNext}
        />
      </FormContainer>
    </div>
  );
};

export default Index;
