
import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { PersonalDetailsForm } from '../PersonalDetailsForm';
import { PersonalDetailsData } from '../types';
import { useState } from 'react';

export interface PersonalDetailsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeData: any; // Updated to match what we're actually using
  onUpdate: (data: any) => Promise<void>;
}

export const PersonalDetailsEditModal: React.FC<PersonalDetailsEditModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeData,
  onUpdate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleComplete = async (completed: boolean, data?: PersonalDetailsData) => {
    if (!completed || !data) return;
    
    try {
      setIsSubmitting(true);
      await onUpdate({
        ...data,
        id: employeeId,
      });
      onClose();
    } catch (error) {
      console.error('Error updating personal details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Personal Details</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <PersonalDetailsForm
            onComplete={handleComplete}
            initialData={employeeData}
            isSubmitting={isSubmitting}
            formRef={formRef}
          />
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
