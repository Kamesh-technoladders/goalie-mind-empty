
import React, { RefObject } from "react";
import { TabNavigation } from "../TabNavigation";
import { NavigationHeader } from "../NavigationHeader";
import { Button } from "@/components/ui/button";
import { FormData } from "@/utils/progressCalculator";

export interface FormContainerProps {
  tabs: { id: string; label: string; isActive: boolean }[];
  onTabChange: (tabId: string) => void;
  onSaveAndNext: (completedData?: any) => Promise<void>;
  activeTab: string;
  formRef: RefObject<HTMLFormElement>;
  formData?: FormData | Record<string, any>;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  tabs,
  onTabChange,
  onSaveAndNext,
  activeTab,
  formRef,
  formData = {},
  isSubmitting,
  children,
}) => {
  const handleSaveAndNext = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="flex flex-col space-y-6">
      <NavigationHeader tabs={tabs} activeTabId={activeTab} onTabChange={handleTabChange} />
      <div className="bg-white p-6 rounded-md shadow">
        <div className="mb-6">
          <TabNavigation tabs={tabs} activeTabId={activeTab} onTabChange={handleTabChange} />
        </div>
        {children}
        <div className="flex justify-end mt-6">
          <Button
            type="button"
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
            className="bg-[rgba(103,80,164,1)] text-white hover:bg-[rgba(103,80,164,0.9)]"
          >
            {isSubmitting ? "Saving..." : "Save & Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};
