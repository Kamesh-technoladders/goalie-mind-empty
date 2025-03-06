
import type { 
  Document as EmployeeDocument,
  Experience as EmployeeExperience,
  Education as EmployeeEducation,
  BankDetails,
  Address,
  EmergencyContact as EmployeeEmergencyContact,
  FamilyMember as EmployeeFamilyMember,
  PersonalInfo
} from "@/services/types/employee.types";
import { RefObject } from "react";

// Make relationship and name required in our local types
export interface EmergencyContact {
  relationship: string;
  name: string;
  phone?: string;
}

export interface FamilyMember {
  relationship: string;
  name: string;
  occupation?: string;
  phone?: string;
}

export type { 
  Address,
  BankDetails as BankAccountData,
  EmployeeEducation as EducationData
};

export interface Experience extends EmployeeExperience {}

// Make documents required in PersonalDetailsData to match PersonalInfo
export interface PersonalDetailsData extends Omit<PersonalInfo, 'documents' | 'emergencyContacts' | 'familyDetails'> {
  id?: string;
  sameAsPresent?: boolean;
  profilePictureUrl?: string;
  aadharUrl?: string;
  panUrl?: string;
  uanUrl?: string;
  esicUrl?: string;
  documents: EmployeeDocument[]; // Now required
  // Make these EmergencyContact and FamilyMember arrays with required fields
  emergencyContacts: EmergencyContact[];
  familyDetails: FamilyMember[];
}

export interface FormComponentProps<T = any> {
  onComplete: (completed: boolean, data?: T) => void;
  initialData?: T | null;
  isSubmitting?: boolean;
}

export interface PersonalDetailsFormProps extends FormComponentProps<PersonalDetailsData> {
  isCheckingEmail?: boolean;
  emailError?: string | null;
  formRef: RefObject<HTMLFormElement>
}

export interface EducationFormProps extends FormComponentProps<EmployeeEducation> {}

export interface ExperienceFormProps {
  onComplete: (completed: boolean, data?: Experience[]) => void;
  experiences?: Experience[];
}

export interface BankAccountFormProps extends FormComponentProps<BankDetails> {}
