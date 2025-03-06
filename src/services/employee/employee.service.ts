
import { EmployeeData } from "../types/employee.types";
import { personalInfoService } from "./personalInfo.service";
import { bankDetailsService } from "./bankDetails.service";
import { experienceService } from "./experience.service";
import { educationService } from "./education.service";
import { supabase } from "@/integrations/supabase/client";

// Helper function to safely insert related employee data
const insertRelatedData = async (tableName: string, data: any) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .insert(data);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    return false;
  }
};

export const employeeService = {
  async createEmployee(data: any) {
    try {
      // 1. Insert into `hr_employees` table
      const { data: employee, error: employeeError } = await supabase
        .from("hr_employees")
        .insert([
          {
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
            aadhar_number: data.documents.find((d: any) => d.documentType === "aadhar")?.documentNumber,
            pan_number: data.documents.find((d: any) => d.documentType === "pan")?.documentNumber,
            uan_number: data.documents.find((d: any) => d.documentType === "uan")?.documentNumber,
            esic_number: data.documents.find((d: any) => d.documentType === "esic")?.documentNumber,
            present_address: data.presentAddress,
            permanent_address: data.sameAsPresent ? data.presentAddress : data.permanentAddress,
          },
        ])
        .select()
        .single();

      if (employeeError) throw employeeError;

      const employeeId = employee.id;

      // 2. Insert into `hr_employee_family_details`
      if (data.familyDetails && data.familyDetails.length > 0) {
        for (const family of data.familyDetails) {
          await insertRelatedData("hr_employee_family_details", {
            employee_id: employeeId,
            relationship: family.relationship,
            name: family.name,
            occupation: family.occupation,
            phone: family.phone,
          });
        }
      }

      // 3. Insert into `hr_employee_emergency_contacts`
      if (data.emergencyContacts && data.emergencyContacts.length > 0) {
        for (const contact of data.emergencyContacts) {
          await insertRelatedData("hr_employee_emergency_contacts", {
            employee_id: employeeId,
            relationship: contact.relationship,
            name: contact.name,
            phone: contact.phone,
          });
        }
      }

      // 4. Insert into `hr_employee_documents`
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          await insertRelatedData("hr_employee_documents", {
            employee_id: employeeId,
            document_type: doc.documentType,
            category: "government_id", // Adjust category if needed
            file_name: doc.fileName,
            file_path: doc.documentUrl,
          });
        }
      }

      return { success: true, employeeId };
    } catch (error) {
      console.error("Error creating employee:", error);
      return { success: false, error };
    }
  },
};
