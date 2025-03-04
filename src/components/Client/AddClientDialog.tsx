
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import supabase from "../../config/supabaseClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const user = useSelector((state: any) => state.auth.user);
  const organization_id = useSelector((state: any) => state.auth.organization_id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    client_name: "",
    display_name: "",
    contact_person_first_name: "",
    contact_person_last_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    website: "",
    currency: "",
    status: "active",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Make sure required fields have fallback values
      const { data, error } = await supabase.from('hr_clients').upsert({
        ...formValues,
        client_name: formValues.client_name || 'Unnamed Client',
        contact_person_first_name: formValues.contact_person_first_name || 'Contact',
        contact_person_last_name: formValues.contact_person_last_name || 'Person',
        display_name: formValues.display_name || formValues.client_name || 'Unnamed Client',
        email: formValues.email || 'email@example.com',
        phone_number: formValues.phone_number || '0000000000',
        organization_id,
        created_by: user?.id,
        updated_by: user?.id,
        // Initialize with default values
        active_employees: 0,
        completed_projects: 0,
        ongoing_projects: 0,
        total_projects: 0
      });

      if (error) throw error;

      toast.success("Client added successfully!");
      queryClient.invalidateQueries({ queryKey: ["hr_clients"] });
      onOpenChange(false);
      setFormValues({
        client_name: "",
        display_name: "",
        contact_person_first_name: "",
        contact_person_last_name: "",
        email: "",
        phone_number: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zip_code: "",
        website: "",
        currency: "",
        status: "active",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add client");
      console.error("Error adding client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                name="client_name"
                value={formValues.client_name}
                onChange={handleChange}
                placeholder="Enter client name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={formValues.display_name}
                onChange={handleChange}
                placeholder="How should the client be displayed?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact_person_first_name">Contact First Name</Label>
                <Input
                  id="contact_person_first_name"
                  name="contact_person_first_name"
                  value={formValues.contact_person_first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_person_last_name">Contact Last Name</Label>
                <Input
                  id="contact_person_last_name"
                  name="contact_person_last_name"
                  value={formValues.contact_person_last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="client@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formValues.phone_number}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formValues.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
