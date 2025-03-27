import { supabase } from '@/integrations/supabase/client';
import { Candidate } from "@/components/jobs/job/types/candidate.types";
import { v4 as uuidv4 } from "uuid";
import { updateCandidateStatus } from './statusService';

interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  currentLocation: string;
  preferredLocation: string;
  totalExperience: {
    years: number;
    months: number;
  };
  relevantExperience: {
    years: number;
    months: number;
  };
  currentSalary: number;
  expectedSalary: number;
  noticePeriod: string;
  offerDetails: string;
  dateOfSubmission: Date;
  resume?: {
    url: string;
    filename: string;
    size: number;
    uploadDate?: string;
  } | null;
  skills: Array<{
    skillName: string;
    rating: number;
  }>;
}

interface DbCandidate {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  current_location?: string;
  preferred_location?: string;
  total_experience: {
    years: number;
    months: number;
  };
  current_salary?: number;
  expected_salary?: number;
  notice_period?: string;
  resume_url?: string;
  resume_filename?: string;
  resume_size?: number;
  resume_upload_date?: string;
  skills: {
    skillName: string;
    rating: number;
  }[];
  status?: string;
  hr_organization_id: string;
}

export const uploadResume = async (file: File, candidateId: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${candidateId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `resumes/${candidateId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('candidates')
      .upload(filePath, file);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('candidates')
      .getPublicUrl(filePath);
    
    return {
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size,
      uploadDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

export const addCandidate = async (candidateData: CandidateData, jobId: string) => {
  try {
    const { firstName, lastName, email, phoneNumber, currentLocation, preferredLocation, 
      totalExperience, relevantExperience, currentSalary, expectedSalary, noticePeriod, resume, skills } = candidateData;
    
    const candidateToInsert: DbCandidate = {
      id: uuidv4(),
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phoneNumber,
      current_location: currentLocation,
      preferred_location: preferredLocation,
      total_experience: {
        years: totalExperience.years,
        months: totalExperience.months
      },
      current_salary: currentSalary,
      expected_salary: expectedSalary,
      notice_period: noticePeriod,
      resume_url: resume?.url,
      resume_filename: resume?.filename,
      resume_size: resume?.size,
      resume_upload_date: resume?.uploadDate || (resume ? new Date().toISOString() : undefined),
      skills: skills,
      status: 'New',
      hr_organization_id: uuidv4(),
    };

    const { data, error } = await supabase
      .from('hr_job_candidates')
      .insert(candidateToInsert);

    if (error) throw error;

    if (data) {
      const candidateId = candidateToInsert.id;
      
      await supabase
        .from('hr_job_applications')
        .insert({
          job_id: jobId,
          candidate_id: candidateId,
          status: 'Applied',
          hr_organization_id: candidateToInsert.hr_organization_id
        });
      
      await addCandidateTimelineEntry(candidateId, 'candidate_create', {
        message: 'Candidate created',
        jobId: jobId
      });
    }

    return data;
  } catch (error) {
    console.error('Error adding candidate:', error);
    throw error;
  }
};

export const updateCandidate = async (candidate: Candidate) => {
  try {
    if (candidate.sub_status_id) {
      await updateCandidateStatus(candidate.id, candidate.sub_status_id);
    }
    
    const candidateToUpdate = {
      id: candidate.id,
      first_name: candidate.name.split(' ')[0],
      last_name: candidate.name.split(' ').slice(1).join(' '),
      email: candidate.contact.email,
      phone: candidate.contact.phone,
      current_location: candidate.currentLocation,
      preferred_location: candidate.preferredLocation,
      total_experience: candidate.totalExperience,
      current_salary: candidate.currentSalary,
      expected_salary: candidate.expectedSalary,
      notice_period: candidate.noticePeriod,
      status: candidate.status,
      skills: Array.isArray(candidate.skills) 
        ? candidate.skills.map(skill => 
            typeof skill === 'string' 
              ? { skillName: skill, rating: 3 } 
              : skill
          )
        : []
    };

    const { error } = await supabase
      .from('hr_job_candidates')
      .update(candidateToUpdate)
      .eq('id', candidate.id);

    if (error) throw error;

    await addCandidateTimelineEntry(candidate.id, 'candidate_edit', {
      message: 'Candidate updated'
    });

    return true;
  } catch (error) {
    console.error('Error updating candidate:', error);
    return false;
  }
};

export const addCandidateTimelineEntry = async (
  candidateId: string,
  eventType: 'status_change' | 'progress_update' | 'resume_upload' | 'resume_validation' | 'candidate_edit' | 'candidate_create',
  eventData: any
) => {
  try {
    const entry = {
      candidate_id: candidateId,
      event_type: eventType,
      event_data: eventData,
      created_by: 'System'
    };

    const { error } = await supabase
      .from('hr_candidate_timeline')
      .insert(entry);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    return false;
  }
};

export const getCandidateTimeline = async (candidateId: string) => {
  try {
    const { data, error } = await supabase
      .from('hr_candidate_timeline')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching candidate timeline:', error);
    return [];
  }
};

export const getCandidatesForJob = async (jobId: string) => {
  try {
    const { data: applications, error: appError } = await supabase
      .from('hr_job_applications')
      .select('*')
      .eq('job_id', jobId);

    if (appError) throw appError;
    
    if (!applications || applications.length === 0) {
      return [];
    }

    const candidateIds = applications.map(app => app.candidate_id);
    
    const { data: candidates, error: candError } = await supabase
      .from('hr_job_candidates')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        current_location,
        preferred_location,
        total_experience,
        current_salary,
        expected_salary,
        notice_period,
        resume_url,
        resume_filename,
        resume_size,
        resume_upload_date,
        skills,
        status,
        main_status_id,
        sub_status_id,
        main_status:job_statuses!main_status_id (
          id,
          name,
          color,
          type
        ),
        sub_status:job_statuses!sub_status_id (
          id,
          name,
          color,
          type
        )
      `)
      .in('id', candidateIds);

    if (candError) throw candError;
    
    if (!candidates) {
      return [];
    }

    return candidates.map(c => {
      const application = applications.find(app => app.candidate_id === c.id);
      
      let candidateSkills: string[] = [];
      if (Array.isArray(c.skills)) {
        candidateSkills = c.skills.map((s: any) => 
          typeof s === 'string' ? s : s.skillName || s
        );
      } else if (c.skills && typeof c.skills === 'object') {
        candidateSkills = Object.values(c.skills).map((s: any) => 
          typeof s === 'string' ? s : s.skillName || s
        );
      }

      const mainStatusName = c.main_status?.name;
      const progress = {
        screening: false,
        interview: false,
        offer: false,
        hired: false,
        joined: false
      };
      
      if (mainStatusName) {
        const stageOrder = ['Screening', 'Interview', 'Offer', 'Hired', 'Joined'];
        const stageIndex = stageOrder.indexOf(mainStatusName);
        
        if (stageIndex >= 0) {
          progress.screening = true;
          
          if (stageIndex >= 1) progress.interview = true;
          if (stageIndex >= 2) progress.offer = true;
          if (stageIndex >= 3) progress.hired = true;
          if (stageIndex >= 4) progress.joined = true;
        }
      } else if (c.status) {
        progress.screening = c.status !== 'New';
        progress.interview = ['Interview', 'Shortlisted', 'Offered', 'Hired', 'Joined'].includes(c.status);
        progress.offer = ['Offered', 'Hired', 'Joined'].includes(c.status);
        progress.hired = ['Hired', 'Joined'].includes(c.status);
        progress.joined = c.status === 'Joined';
      }
      
      return {
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        contact: {
          email: c.email,
          phone: c.phone || '',
          emailVisible: false,
          phoneVisible: false
        },
        owner: 'HR Team',
        resume: c.resume_url ? {
          url: c.resume_url,
          filename: c.resume_filename || 'resume.pdf',
          size: c.resume_size || 0,
          uploadDate: c.resume_upload_date || new Date().toISOString()
        } : null,
        resumeAnalysis: {
          score: application?.resume_score || 0,
          status: c.resume_url ? 'analyzed' : 'not_uploaded'
        },
        progress: progress,
        status: c.status || 'New',
        main_status_id: c.main_status_id,
        sub_status_id: c.sub_status_id,
        main_status: c.main_status,
        sub_status: c.sub_status,
        currentLocation: c.current_location || '',
        preferredLocation: c.preferred_location || '',
        totalExperience: c.total_experience || { years: 0, months: 0 },
        relevantExperience: c.total_experience || { years: 0, months: 0 },
        currentSalary: c.current_salary || 0,
        expectedSalary: c.expected_salary || 0,
        noticePeriod: c.notice_period || '',
        skills: candidateSkills
      };
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
};

export const createDummyCandidate = async (jobId: string) => {
  try {
    const { data: job, error: jobError } = await supabase
      .from('hr_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    const names = ['John Smith', 'Jane Doe', 'Michael Johnson', 'Emily Williams', 'David Brown'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const [firstName, lastName] = randomName.split(' ');

    const dummyCandidate = {
      id: uuidv4(),
      hr_organization_id: job.hr_organization_id,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      current_location: 'New York',
      preferred_location: job.location?.[0] || 'Remote',
      total_experience: {
        years: Math.floor(Math.random() * 10) + 1,
        months: Math.floor(Math.random() * 12)
      },
      current_salary: 75000 + Math.floor(Math.random() * 50000),
      expected_salary: 90000 + Math.floor(Math.random() * 50000),
      notice_period: ['Immediate', '15 Days', '30 Days', '60 Days'][Math.floor(Math.random() * 4)],
      skills: job.skills.map((skill: string) => ({
        skillName: skill,
        rating: Math.floor(Math.random() * 3) + 3
      })),
      status: 'New'
    };

    const { data: candidateData, error } = await supabase
      .from('hr_job_candidates')
      .insert(dummyCandidate);
    
    if (error) throw error;

    if (candidateData) {
      await supabase
        .from('hr_job_applications')
        .insert({
          job_id: jobId,
          candidate_id: dummyCandidate.id,
          status: 'Applied',
          resume_score: Math.floor(Math.random() * 50) + 50,
          hr_organization_id: job.hr_organization_id
        });
      
      await addCandidateTimelineEntry(dummyCandidate.id, 'candidate_create', {
        message: 'Candidate created',
        jobId: jobId
      });
    }

    return candidateData;
  } catch (error) {
    console.error('Error creating dummy candidate:', error);
    return null;
  }
};

export const getCandidates = getCandidatesForJob;
export const createDummyData = createDummyCandidate;
