
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BLOOD_GROUPS, GENDER, MARITAL_STATUS } from "@/components/employee/personal-details/schema/personalDetailsSchema";

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateForm = (formData: any) => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.employeeId) newErrors.employeeId = "Employee ID is required";
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    // Phone validation
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }
    
    // Gender validation
    if (formData.gender && !GENDER.includes(formData.gender)) {
      newErrors.gender = "Please select a valid gender";
    }
    
    // Blood group validation
    if (formData.bloodGroup && !BLOOD_GROUPS.includes(formData.bloodGroup)) {
      newErrors.bloodGroup = "Please select a valid blood group";
    }
    
    // Marital status validation
    if (formData.maritalStatus && !MARITAL_STATUS.includes(formData.maritalStatus)) {
      newErrors.maritalStatus = "Please select a valid marital status";
    }
    
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
    
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    isValid,
    validateForm
  };
};

export default useFormValidation;
