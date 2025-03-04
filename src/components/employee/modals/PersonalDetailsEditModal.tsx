
import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonalDetailsForm } from "../PersonalDetailsForm";
import { PersonalDetailsData } from "../types";

interface PersonalDetailsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: PersonalDetailsData;
  onSave: (data: PersonalDetailsData) => void;
  isSubmitting: boolean;
}

export const PersonalDetailsEditModal: React.FC<PersonalDetailsEditModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  isSubmitting,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleComplete = (completed: boolean, data?: PersonalDetailsData) => {
    if (completed && data) {
      onSave(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
        </DialogHeader>
        <PersonalDetailsForm
          onComplete={handleComplete}
          initialData={initialData}
          isSubmitting={isSubmitting}
          formRef={formRef}
        />
      </DialogContent>
    </Dialog>
  );
};
