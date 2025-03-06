
import React, { ReactNode, FormEvent, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormData } from "@/utils/progressCalculator";

export interface FormContainerProps {
  children: ReactNode;
  tabs: { id: string; label: string; isActive: boolean }[];
  onTabChange: (tabId: string) => void;
  onSaveAndNext: (completedData?: any) => Promise<void>;
  activeTab: string;
  formRef: RefObject<HTMLFormElement>;
  formData: FormData; // Add this to fix the missing prop error
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  tabs,
  onTabChange,
  onSaveAndNext,
  activeTab,
  formRef,
  formData
}) => {
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    
    if (form) {
      // Trigger form validation
      const isValid = await form.reportValidity();
      
      if (isValid) {
        // If the form is valid, trigger its submit event
        const submitEvent = new Event("submit", { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  return (
    <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
      <div className="flex justify-between items-center mb-6">
        {/* Fix the prop error - tabs should be spread as individual TabsTrigger components */}
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => onTabChange(tab.id)}
              disabled={!tab.isActive && tab.id !== activeTab}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type="button"
          onClick={handleFormSubmit}
        >
          Save & Next
        </Button>
      </div>
      <TabsContent value={activeTab} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};
