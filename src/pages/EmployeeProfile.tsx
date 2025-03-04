// Fix imports section
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import { ProfileHeader } from "@/components/employee/profile/ProfileHeader";
import { ProfileContent } from "@/components/employee/profile/ProfileContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoSection } from "@/components/employee/profile/sections/PersonalInfoSection";
import { EmploymentInfoSection } from "@/components/employee/profile/sections/EmploymentInfoSection";
import { EducationSection } from "@/components/employee/profile/sections/EducationSection";
import { ExperienceSection } from "@/components/employee/profile/sections/ExperienceSection";
import { BankInfoSection } from "@/components/employee/profile/sections/BankInfoSection";
import { LoaderCircle } from "lucide-react";

// In the component, fix the prop issues by adding employeeId
const EmployeeProfile = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { employeeData, isLoading, handleEditPersonalInfo, handleEditEducation, handleEditBankInfo } = useEmployeeProfile(employeeId);
  
  // This part of the render contains a fix for education and bank sections
  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && (
        <div className="flex justify-center items-center h-screen">
          <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
        </div>
      )}
      
      {!isLoading && employeeData && (
        <>
          <ProfileHeader
            personalInfo={employeeData.personalInfo}
            onEdit={handleEditPersonalInfo}
          />
          
          <div className="container mx-auto px-4 py-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-card">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <ProfileContent 
                  personalInfo={employeeData.personalInfo}
                  educationInfo={employeeData.education}
                  bankInfo={employeeData.bankDetails}
                  experienceInfo={employeeData.experiences}
                  employmentInfo={employeeData.employmentInfo}
                  onEditPersonalInfo={handleEditPersonalInfo}
                  onEditEducation={handleEditEducation}
                  onEditBankInfo={handleEditBankInfo}
                  employeeId={employeeId}
                />
              </TabsContent>
              
              <TabsContent value="employment" className="space-y-6">
                <EmploymentInfoSection employmentInfo={employeeData.employmentInfo} />
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6">
                <PersonalInfoSection data={employeeData.personalInfo} onEdit={handleEditPersonalInfo} />
                <EducationSection 
                  data={employeeData.education} 
                  onEdit={handleEditEducation}
                  employeeId={employeeId} 
                />
                <ExperienceSection data={employeeData.experiences} />
                {/* Remove onEdit prop if it doesn't exist on BankInfoSection */}
                <BankInfoSection data={employeeData.bankDetails} employeeId={employeeId} />
              </TabsContent>
              
              <TabsContent value="payroll" className="space-y-6">
                <p className="text-muted-foreground">Payroll information will be available here.</p>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeProfile;
