
import { supabase } from "@/integrations/supabase/client";

export const uploadDocument = async (
  file: File,
  bucketName: string,
  type: string
): Promise<string> => {
  try {
    if (!file || !bucketName || !type) {
      throw new Error('Missing required fields for upload');
    }

    console.log('Uploading document:', {
      fileName: file.name,
      type,
      bucket: bucketName
    });

    // Create a properly structured FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Call the upload-document edge function
    const { data, error } = await supabase.functions.invoke('upload-document', {
      body: formData
    });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    return data.url;
  } catch (error) {
    console.error('Upload document error:', error);
    throw error;
  }
};
