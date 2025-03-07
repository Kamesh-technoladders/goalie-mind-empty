
import React, { RefObject } from "react";
import { TabNavigation } from "../TabNavigation";
import { LoaderCircle } from "lucide-react";

interface FormContainerProps {
  children: React.ReactNode;
  tabs: Array<{ id: string; label: string; isActive?: boolean }>;
  onTabChange: (tabId: string) => void;
  onSaveAndNext: (data: any) => void;
  activeTab: string;
  isSubmitting?: boolean;
  formRef: RefObject<HTMLFormElement>;
  onCancel?: () => void;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  tabs,
  onTabChange,
  onSaveAndNext,
  activeTab,
  isSubmitting = false,
  formRef,
  onCancel
}) => {
  return (
    <section className="bg-white shadow-sm rounded-lg mt-6 p-6">
      <TabNavigation tabs={tabs} onTabChange={onTabChange} />
      {children}
      <div className="h-px my-6 bg-gray-200" />
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (formRef.current) {
              formRef.current.requestSubmit();
            }
          }}
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <LoaderCircle className="animate-spin h-4 w-4" />}
          {activeTab === "bank" ? "Submit" : "Save & Next"}
        </button>
      </div>
    </section>
  );
};
