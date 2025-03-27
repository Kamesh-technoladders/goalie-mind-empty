import { MainStatus, SubStatus } from "@/services/statusService";

// Define the progress mapping for candidate statuses
export const PROGRESS_MAPPING: Record<string, { screening: boolean; interview: boolean; offer: boolean; hired: boolean; joined: boolean }> = {
  'New': { screening: true, interview: false, offer: false, hired: false, joined: false },
  'Screening': { screening: true, interview: false, offer: false, hired: false, joined: false },
  'Interview': { screening: true, interview: true, offer: false, hired: false, joined: false },
  'Shortlisted': { screening: true, interview: true, offer: false, hired: false, joined: false },
  'Offered': { screening: true, interview: true, offer: true, hired: false, joined: false },
  'Hired': { screening: true, interview: true, offer: true, hired: true, joined: false },
  'Joined': { screening: true, interview: true, offer: true, hired: true, joined: true },
  'Rejected': { screening: true, interview: false, offer: false, hired: false, joined: false },
  'On Hold': { screening: true, interview: false, offer: false, hired: false, joined: false },
  'Withdrawn': { screening: true, interview: false, offer: false, hired: false, joined: false }
};

// Define the candidate status for display in the UI
export const CANDIDATE_STATUSES = [
  'New',
  'Screening',
  'Interview',
  'Shortlisted',
  'Offered',
  'Hired',
  'Joined',
  'Rejected',
  'On Hold',
  'Withdrawn'
];

// Define the candidate status stages for the status management system
export const CANDIDATE_STAGES = [
  {
    name: 'Screening',
    color: '#f59e0b',
    info: false,
    options: [
      { label: 'Initial Screening', value: 'initial_screening' },
      { label: 'Resume Review', value: 'resume_review' },
      { label: 'Phone Screening', value: 'phone_screening' },
      { label: 'Shortlisted', value: 'shortlisted' }
    ]
  },
  {
    name: 'Interview',
    color: '#3b82f6',
    info: false,
    options: [
      { label: 'Interview Scheduled', value: 'interview_scheduled' },
      { label: 'First Round', value: 'first_round' },
      { label: 'Technical Round', value: 'technical_round' },
      { label: 'HR Round', value: 'hr_round' },
      { label: 'Final Round', value: 'final_round' }
    ]
  },
  {
    name: 'Offer',
    color: '#10b981',
    info: false,
    options: [
      { label: 'Offer Preparation', value: 'offer_preparation' },
      { label: 'Offer Extended', value: 'offer_extended' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Offer Accepted', value: 'offer_accepted' },
      { label: 'Offer Declined', value: 'offer_declined' }
    ]
  },
  {
    name: 'Onboarding',
    color: '#6366f1',
    info: true,
    options: [
      { label: 'Background Check', value: 'background_check' },
      { label: 'Documentation', value: 'documentation' },
      { label: 'Onboarding', value: 'onboarding' },
      { label: 'Joined', value: 'joined' }
    ]
  },
  {
    name: 'Rejected',
    color: '#ef4444',
    info: false,
    options: [
      { label: 'Skills Mismatch', value: 'skills_mismatch' },
      { label: 'Cultural Fit', value: 'cultural_fit' },
      { label: 'Salary Expectations', value: 'salary_expectations' },
      { label: 'Better Candidate Selected', value: 'better_candidate' }
    ]
  }
];

// Progress type for type safety
export interface Progress {
  screening: boolean;
  interview: boolean;
  offer: boolean;
  hired: boolean;
  joined: boolean;
}

// Define the Candidate type that represents a job candidate
export interface Candidates {
  id: string;
  name: string;
  contact: {
    email: string;
    phone: string;
    emailVisible: boolean;
    phoneVisible: boolean;
  };
  owner: string;
  resume: {
    url: string;
    filename: string;
    size: number;
    uploadDate: string;
  } | null;
  resumeAnalysis: {
    score: number;
    status?: 'analyzed' | 'pending' | 'failed' | 'not_uploaded' | 'processing';
    details?: any;
  };
  progress: Progress;
  status: string;
  main_status_id?: string;
  sub_status_id?: string;
  main_status?: Partial<MainStatus> | null;
  sub_status?: Partial<SubStatus> | null;
  currentLocation?: string;
  preferredLocation?: string;
  totalExperience: {
    years: number;
    months: number;
  };
  relevantExperience?: {
    years: number;
    months: number;
  };
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  skills: string[];
}
