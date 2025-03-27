
import { supabase } from '@/integrations/supabase/client';

export interface StatusType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  type: 'main' | 'sub';
  parent_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MainStatus extends StatusType {
  subStatuses?: SubStatus[];
}

export interface SubStatus extends StatusType {
  parent?: MainStatus;
}

// Fetch all statuses with main and sub statuses organized
export const fetchAllStatuses = async (): Promise<MainStatus[]> => {
  try {
    // Fetch all main statuses
    const { data: mainStatuses, error: mainError } = await supabase
      .from('job_statuses')
      .select('*')
      .eq('type', 'main')
      .order('display_order', { ascending: true });

    if (mainError) throw mainError;
    
    // Fetch all sub statuses
    const { data: subStatuses, error: subError } = await supabase
      .from('job_statuses')
      .select('*')
      .eq('type', 'sub')
      .order('display_order', { ascending: true });
    
    if (subError) throw subError;
    
    // Organize sub statuses under their parent main statuses
    const result = mainStatuses.map(main => {
      const subs = subStatuses.filter(sub => sub.parent_id === main.id);
      return {
        ...main,
        subStatuses: subs
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return [];
  }
};

// Create a new main status
export const createMainStatus = async (data: {
  name: string;
  description?: string;
  color?: string;
  display_order?: number;
}): Promise<MainStatus | null> => {
  try {
    const { data: newStatus, error } = await supabase
      .from('job_statuses')
      .insert({
        name: data.name,
        description: data.description || null,
        color: data.color || '#777777',
        type: 'main',
        display_order: data.display_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...newStatus,
      subStatuses: []
    };
  } catch (error) {
    console.error('Error creating main status:', error);
    return null;
  }
};

// Create a new sub status
export const createSubStatus = async (data: {
  name: string;
  parent_id: string;
  description?: string;
  color?: string;
  display_order?: number;
}): Promise<SubStatus | null> => {
  try {
    const { data: newStatus, error } = await supabase
      .from('job_statuses')
      .insert({
        name: data.name,
        parent_id: data.parent_id,
        description: data.description || null,
        color: data.color || '#777777',
        type: 'sub',
        display_order: data.display_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return newStatus;
  } catch (error) {
    console.error('Error creating sub status:', error);
    return null;
  }
};

// Update an existing status (main or sub)
export const updateStatus = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    display_order?: number;
  }
): Promise<StatusType | null> => {
  try {
    const { data: updatedStatus, error } = await supabase
      .from('job_statuses')
      .update({
        name: data.name,
        description: data.description,
        color: data.color,
        display_order: data.display_order
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return updatedStatus;
  } catch (error) {
    console.error('Error updating status:', error);
    return null;
  }
};

// Delete a status (main or sub)
export const deleteStatus = async (id: string, forceDeleteSubStatuses = false): Promise<boolean> => {
  try {
    // Check if it's a main status with sub statuses
    const { data: subStatuses } = await supabase
      .from('job_statuses')
      .select('id')
      .eq('parent_id', id);
    
    if (subStatuses && subStatuses.length > 0) {
      if (!forceDeleteSubStatuses) {
        throw new Error('Cannot delete a main status that has sub statuses');
      } else {
        // If force delete is enabled, delete all sub statuses first
        for (const subStatus of subStatuses) {
          // Check if any candidates are using this sub status
          const { data: candidatesWithSubStatus } = await supabase
            .from('hr_job_candidates')
            .select('id')
            .eq('sub_status_id', subStatus.id)
            .limit(1);
          
          if (candidatesWithSubStatus && candidatesWithSubStatus.length > 0) {
            throw new Error('Cannot delete a status that is in use by candidates');
          }
          
          // Delete the sub status
          const { error: subDeleteError } = await supabase
            .from('job_statuses')
            .delete()
            .eq('id', subStatus.id);
          
          if (subDeleteError) throw subDeleteError;
        }
      }
    }
    
    // Check if it's in use by any candidate
    const { data: candidatesWithMainStatus } = await supabase
      .from('hr_job_candidates')
      .select('id')
      .eq('main_status_id', id)
      .limit(1);
    
    const { data: candidatesWithSubStatus } = await supabase
      .from('hr_job_candidates')
      .select('id')
      .eq('sub_status_id', id)
      .limit(1);
    
    if ((candidatesWithMainStatus && candidatesWithMainStatus.length > 0) ||
        (candidatesWithSubStatus && candidatesWithSubStatus.length > 0)) {
      throw new Error('Cannot delete a status that is in use by candidates');
    }
    
    // Delete the status
    const { error } = await supabase
      .from('job_statuses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting status:', error);
    throw error;
  }
};

// Update a candidate's status
export const updateCandidateStatus = async (
  candidateId: string,
  subStatusId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('hr_job_candidates')
      .update({
        sub_status_id: subStatusId
        // main_status_id will be updated automatically by the database trigger
      })
      .eq('id', candidateId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return false;
  }
};

// Get sub statuses for a main status
export const getSubStatusesForMainStatus = async (mainStatusId: string): Promise<SubStatus[]> => {
  try {
    const { data, error } = await supabase
      .from('job_statuses')
      .select('*')
      .eq('type', 'sub')
      .eq('parent_id', mainStatusId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sub statuses:', error);
    return [];
  }
};
