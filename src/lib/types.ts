
import { ReactNode } from "react";

export interface JobData {
  id: string;  // Changed from number to string since we're using UUIDs
  jobId: string;
  title: string;
  department: string;
  location: string[];
  type: string;
  status: "Active" | "Pending" | "Completed" | "OPEN" | "HOLD" | "CLOSE";
  postedDate: string;
  applications: number;
  dueDate: string;
  clientOwner: string;
  hiringMode: string;
  submissionType: "Internal" | "Client";
  jobType: "Internal" | "External"; // Added jobType field
  experience?: {
    min?: { years: number; months: number };
    max?: { years: number; months: number };
  };
  skills?: string[];
  description?: string;
  descriptionBullets?: string[];
  clientDetails?: {
    clientName?: string;
    clientBudget?: string;
    endClient?: string;
    pointOfContact?: string;
  };
  jobCategory?: string;
  primarySkills?: string[];
  secondarySkills?: string[];
  staffingManager?: string;
  interviewProcess?: string[];
  payRate?: string;
  billRate?: string;
  startDate?: string;
  assignedTo?: {
    type: "individual" | "team" | "vendor";
    name: string;
  };
  budgets?: {
    clientBudget?: string;
    hrBudget?: string;
    vendorBudget?: string;
  };
  customUrl?: string;
  noticePeriod?: string;
  budgetType?: string;
  clientProjectId?: string; 
  numberOfCandidates?: number;
  organization?: string;
}

export interface Candidate {
  id: string;  // Changed to string to match UUID
  name: string;
  status: CandidateStatus | "New" | "InReview" | "Engaged" | "Available" | "Offered" | "Hired" | "Rejected";
  experience: string | null;
  matchScore: number | null;
  appliedDate: string;
  skills: Array<{ name: string; rating: number }> | string[];  // Updated to support both formats
  email?: string;
  phone?: string;
  resume?: string;
  resumeUrl?: string;
  appliedFrom?: string;
  currentSalary?: number | string;
  expectedSalary?: number | string;
  location?: string;
  metadata?: {
    currentLocation?: string;
    preferredLocations?: string[];
    totalExperience?: string | number;
    relevantExperience?: string | number;
    currentSalary?: string | number;
    expectedSalary?: string | number;
    resume_url?: string;
  };
  skill_ratings?: Array<{ name: string; rating: number }>;
  currentStage?: string;
  completedStages?: string[];
  hasValidatedResume?: boolean;
  profit?: ReactNode;
  organization?: string;
  updatedBy?: string;
}

export enum CandidateStatus {
  Screening = "Screening",
  Interviewing = "Interviewing",
  Selected = "Selected",
  Rejected = "Rejected",
  New = "New",
  InReview = "InReview",
  Engaged = "Engaged",
  Available = "Available",
  Offered = "Offered",
  Hired = "Hired"
}


