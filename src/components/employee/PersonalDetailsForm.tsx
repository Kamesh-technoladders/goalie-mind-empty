
import React from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { BasicInfoSection } from "./personal-details/BasicInfoSection";
import { AddressSection } from "./personal-details/AddressSection";
import { EmergencyContactsSection } from "./personal-details/EmergencyContactsSection";
import { FamilyDetailsSection } from "./personal-details/FamilyDetailsSection";
import { PersonalDetailsFormProps, PersonalDetailsData, EmergencyContact, FamilyMember } from "./types";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalDetailsSchema, PersonalDetailsFormSchema, GENDER, BLOOD_GROUPS, MARITAL_STATUS } from "./personal-details/schema/personalDetailsSchema";
import { useFormValidation } from "./personal-details/hooks/useFormValidation";
import { useFormInitialization } from "./personal-details/hooks/useFormInitialization";
import { toast } from "sonner";
import { employeeService } from "@/services/employee/employee.service"; 

export const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ 
  onComplete, 
  initialData,
  isCheckingEmail,
  emailError,
  isSubmitting,
  formRef
}) => {
  const { validateForm } = useFormValidation();
  const {
    emergencyContacts,
    setEmergencyContacts,
    familyDetails,
    setFamilyDetails,
    documents,
    setDocuments
  } = useFormInitialization(initialData);

  // Ensure gender, bloodGroup, and maritalStatus are valid enum values
  const safeGender = initialData?.gender && GENDER.includes(initialData.gender as any) 
    ? initialData.gender as any 
    : GENDER[0];
    
  const safeBloodGroup = initialData?.bloodGroup && BLOOD_GROUPS.includes(initialData.bloodGroup as any)
    ? initialData.bloodGroup as any
    : BLOOD_GROUPS[0];
    
  const safeMaritalStatus = initialData?.maritalStatus && MARITAL_STATUS.includes(initialData.maritalStatus as any)
    ? initialData.maritalStatus as any
    : MARITAL_STATUS[0];

  // Fix default values type issues
  const form = useForm<PersonalDetailsFormSchema>({
    defaultValues: {
      ...initialData,
      gender: safeGender, // Ensure it's one of the allowed enum values
      bloodGroup: safeBloodGroup, // Ensure it's one of the allowed enum values
      maritalStatus: safeMaritalStatus, // Ensure it's one of the allowed enum values
      dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : undefined,
      sameAsPresent: Boolean(initialData?.sameAsPresent) || false
    },
    resolver: zodResolver(personalDetailsSchema)
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const isValid = validateForm(emergencyContacts, familyDetails, setEmergencyContacts, setFamilyDetails);
  
    if (!isValid) {
      toast.error("Please add at least one emergency contact and one family member");
      onComplete(false);
      return;
    }
  
    const formData: PersonalDetailsData = {
      ...data,
      dateOfBirth: data.dateOfBirth?.toISOString(),
      emergencyContacts: emergencyContacts.map(contact => ({
        name: contact.name || "",
        relationship: contact.relationship || "",
        phone: contact.phone || ""
      })) as EmergencyContact[],
      familyDetails: familyDetails.map(member => ({
        name: member.name || "",
        relationship: member.relationship || "",
        occupation: member.occupation || "",
        phone: member.phone || ""
      })) as FamilyMember[],
      documents,
    };
    
    console.log("formData", formData);
    
    try {
      // Make this an async function that returns a promise
      const result = await employeeService.createEmployee(formData);
      onComplete(true, formData);
      toast.success("Personal details saved successfully");
    } catch (error) {
      console.error("Error saving personal details:", error);
      toast.error("Failed to save personal details. Please try again.");
      onComplete(false);
    }
  });

  return (
    <Form {...form}>
      <form ref={formRef} id="personalDetailsForm" onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoSection 
          register={form} 
          errors={form.formState.errors} 
          isCheckingEmail={isCheckingEmail} 
          emailError={emailError} 
          profilePictureUrl={form.watch("profilePictureUrl")}
          onProfilePictureChange={(url) => form.setValue("profilePictureUrl", url)}
          onProfilePictureDelete={() => {
            form.setValue("profilePictureUrl", "");
            // Return a Promise to fix the TS error
            return Promise.resolve();
          }}
          documents={documents} 
          onDocumentsChange={setDocuments} 
          setValue={form.setValue} 
          watch={form.watch} 
        />
        <AddressSection form={form} />
        <EmergencyContactsSection contacts={emergencyContacts} onContactsChange={setEmergencyContacts} maritalStatus={form.watch("maritalStatus")} />
        <FamilyDetailsSection familyMembers={familyDetails} onFamilyMembersChange={setFamilyDetails} maritalStatus={form.watch("maritalStatus")} />
      </form>
    </Form>
  );
};
