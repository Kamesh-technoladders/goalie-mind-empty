
import React from "react";
import { useParams } from "react-router-dom";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import { ProfileHeader } from "@/components/employee/profile/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoSection } from "@/components/employee/profile/sections/PersonalInfoSection";
import { EmploymentInfoSection } from "@/components/employee/profile/sections/EmploymentInfoSection";
import { EducationSection } from "@/components/employee/profile/sections/EducationSection";
import { ExperienceSection } from "@/components/employee/profile/sections/ExperienceSection";
import { BankInfoSection } from "@/components/employee/profile/sections/BankInfoSection";
import { LoaderCircle } from "lucide-react";

const EmployeeProfile = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { 
    employeeData, 
    isLoading,
    handleEdit,
    isEmploymentModalOpen, 
    setIsEmploymentModalOpen,
    isPersonalModalOpen, 
    setIsPersonalModalOpen,
    handleUpdateEmployment,
    handleUpdatePersonal,
    calculateYearsOfExperience,
    totalExperience,
    handleEditPersonalInfo,
    handleEditEducation,
    handleEditBankInfo
  } = useEmployeeProfile(employeeId);
  
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
            employeeId={employeeData.employeeId}
            firstName={employeeData.firstName}
            lastName={employeeData.lastName}
            email={employeeData.email}
            onEdit={handleEditPersonalInfo}
            profilePictureUrl={employeeData.profilePictureUrl}
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
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <PersonalInfoSection
                      phone={employeeData.phone}
                      dateOfBirth={employeeData.dateOfBirth}
                      maritalStatus={employeeData.maritalStatus}
                      onEdit={handleEditPersonalInfo}
                    />

                    <EmploymentInfoSection
                      employeeId={employeeData.employeeId}
                      onEdit={() => handleEdit("employment")}
                    />

                    <EducationSection
                      employeeId={employeeId || ''}
                      onEdit={handleEditEducation}
                    />

                    <BankInfoSection
                      employeeId={employeeId || ''}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="employment" className="space-y-6">
                <EmploymentInfoSection
                  employeeId={employeeData.employeeId}
                  onEdit={() => handleEdit("employment")}
                />
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6">
                <PersonalInfoSection
                  phone={employeeData.phone}
                  dateOfBirth={employeeData.dateOfBirth}
                  maritalStatus={employeeData.maritalStatus}
                  onEdit={handleEditPersonalInfo}
                />
                <EducationSection 
                  employeeId={employeeId || ''}
                  onEdit={handleEditEducation}
                />
                <ExperienceSection 
                  employeeId={employeeId || ''}
                />
                <BankInfoSection 
                  employeeId={employeeId || ''}
                />
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
