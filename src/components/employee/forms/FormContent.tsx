
import React from "react";
import { PersonalDetailsForm } from "../PersonalDetailsForm";
import { EducationForm } from "../EducationForm";
import { ExperienceForm } from "../ExperienceForm";
import { BankAccountForm } from "../BankAccountForm";
import { FormProgress, FormData } from "@/utils/progressCalculator";
import { Experience } from "../types";
import { TabTypes } from "@/hooks/form/useFormState";

interface FormContentProps {
  activeTab: string;
  formData: FormData;
  updateSectionProgress: (section: keyof FormProgress, completed: boolean) => void;
  updateFormData: (section: keyof FormData, data: any) => void;
  formRef: React.RefObject<HTMLFormElement>; 
  isCheckingEmail?: boolean;
  emailError?: string | null;
  isSubmitting?: boolean;
  handleSaveAndNext: (data: any) => void;
}

export const FormContent: React.FC<FormContentProps> = ({
  activeTab,
  formData,
  updateSectionProgress,
  updateFormData,
  isCheckingEmail,
  emailError,
  isSubmitting,
  formRef,
  handleSaveAndNext
}) => {
  switch (activeTab) {
    case "personal":
      return (
        <PersonalDetailsForm
          onComplete={(completed: boolean, data?: any) => {
            if (completed && data) {
              handleSaveAndNext(data);
            }
          }}
          initialData={formData.personal}
          isCheckingEmail={isCheckingEmail}
          emailError={emailError}
          isSubmitting={isSubmitting}
          formRef={formRef}
        />
      );
    case "education":
      return (
        <>
          <EducationForm
            onComplete={(completed: boolean, data?: any) => {
              if (completed && data) {
                updateFormData("education", data);
                updateSectionProgress("education", completed);
                handleSaveAndNext(data);
              }
            }}
            initialData={formData.education}
          />
          <div className="shrink-0 h-px mt-[29px] border-[rgba(239,242,255,1)] border-solid border-2" />
          <ExperienceForm
            onComplete={(completed: boolean, data?: Experience[]) => {
              if (data) {
                updateFormData("experience", data);
                updateSectionProgress("experience", true); // Always mark as complete even if empty
              }
            }}
            experiences={formData.experience as Experience[]}
          />
        </>
      );
    case "bank":
      return (
        <BankAccountForm
          onComplete={(completed: boolean, data?: any) => {
            if (completed && data) {
              handleSaveAndNext(data);
            }
          }}
          initialData={formData.bank}
        />
      );
    default:
      return null;
  }
};
