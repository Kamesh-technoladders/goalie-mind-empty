
import { EmployeeData } from "../types/employee.types";
import { personalInfoService } from "./personalInfo.service";
import { bankDetailsService } from "./bankDetails.service";
import { experienceService } from "./experience.service";
import { educationService } from "./education.service";
import supabase from "@/config/supabaseClient";

export const employeeService = {
  async createEmployee(data: any) {
    try {
      // 1. Insert into `hr_employees` table
      const { data: employee, error: employeeError } = await supabase
        .from("hr_employees")
        .insert([
          {
            // Only include fields that exist in the hr_employees table
            employee_id: data.employeeId,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
            blood_group: data.bloodGroup,
            marital_status: data.maritalStatus,
            profile_picture_url: data.profilePictureUrl,
            aadhar_number: data.documents?.find((d: any) => d.documentType === "aadhar")?.documentNumber,
            pan_number: data.documents?.find((d: any) => d.documentType === "pan")?.documentNumber,
            uan_number: data.documents?.find((d: any) => d.documentType === "uan")?.documentNumber,
            esic_number: data.documents?.find((d: any) => d.documentType === "esic")?.documentNumber,
            present_address: data.presentAddress,
            permanent_address: data.sameAsPresent ? data.presentAddress : data.permanentAddress,
            // Add any missing required fields here
            organization_id: '1', // Default organization ID
            // Add any other required fields
          },
        ])
        .select()
        .single();

      if (employeeError) throw employeeError;

      const employeeId = employee.id;

      // Create a custom function to handle supabase insert operations for employee related tables
      const insertEmployeeData = async (table: string, data: any[], employeeIdField: string = 'employee_id') => {
        if (!data || data.length === 0) return;
        
        const formattedData = data.map(item => ({
          ...item,
          [employeeIdField]: employeeId
        }));
        
        const { error } = await supabase.from(table).insert(formattedData);
        if (error) throw error;
      };

      // 2. Insert into `hr_employee_family_details` table
      if (data.familyDetails && data.familyDetails.length > 0) {
        const familyData = data.familyDetails.map((family: any) => ({
          relationship: family.relationship || "other", // Set a default if missing
          name: family.name,
          occupation: family.occupation,
          phone: family.phone,
        }));
        await insertEmployeeData("hr_employee_family_details", familyData);
      }

      // 3. Insert into `hr_employee_emergency_contacts` table
      if (data.emergencyContacts && data.emergencyContacts.length > 0) {
        const contactsData = data.emergencyContacts.map((contact: any) => ({
          relationship: contact.relationship || "other", // Set a default if missing
          name: contact.name,
          phone: contact.phone,
        }));
        await insertEmployeeData("hr_employee_emergency_contacts", contactsData);
      }

      // 4. Insert into `hr_employee_documents` table
      if (data.documents && data.documents.length > 0) {
        const documentsData = data.documents.map((doc: any) => ({
          document_type: doc.documentType,
          category: "government_id", // Adjust category if needed
          file_name: doc.fileName,
          file_path: doc.documentUrl,
        }));
        await insertEmployeeData("hr_employee_documents", documentsData);
      }

      return { success: true, employeeId };
    } catch (error) {
      console.error("Error creating employee:", error);
      return { success: false, error };
    }
  },
};
