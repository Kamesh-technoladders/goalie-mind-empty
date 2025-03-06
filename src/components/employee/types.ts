
import type { 
  Document as EmployeeDocument,
  Experience as EmployeeExperience,
  Education as EmployeeEducation,
  BankDetails,
  Address,
  EmergencyContact as BaseEmergencyContact,
  FamilyMember as BaseFamilyMember,
  PersonalInfo
} from "@/services/types/employee.types";
import { RefObject } from "react";

export type { 
  Address,
  BankDetails as BankAccountData,
  EmployeeEducation as EducationData
};

// Make sure EmergencyContact has required fields matching the database
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// Make sure FamilyMember has required fields matching the database
export interface FamilyMember {
  name: string;
  relationship: string;
  occupation: string;
  phone: string;
}

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
  emergencyContacts: EmergencyContact[]; // Using our defined type with required fields
  familyDetails: FamilyMember[]; // Using our defined type with required fields
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

export interface EducationSectionProps {
  employeeId: string;
  onEdit: () => void;
}

export interface BankInfoSectionProps {
  employeeId: string;
  onEdit: () => void;
}
