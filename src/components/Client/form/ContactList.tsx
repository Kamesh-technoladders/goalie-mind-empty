
import React from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { FormField, FormItem, FormMessage } from "../../ui/form";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { ClientFormValues } from "@/lib/schemas/client";
import { Trash2 } from "lucide-react";

interface ContactListProps {
  form: UseFormReturn<ClientFormValues>;
}

const ContactList: React.FC<ContactListProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const addContact = () => {
    append({ name: "", email: "", phone: "", designation: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Contact Persons</Label>
        <Button 
          type="button" 
          onClick={addContact} 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          + Add Contact Person
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-md bg-gray-50 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Contact {index + 1}</h4>
            {fields.length > 1 && (
              <Button 
                type="button" 
                onClick={() => remove(index)} 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-red-500"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`contacts.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <Label>Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Contact Name" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`contacts.${index}.email`}
              render={({ field }) => (
                <FormItem>
                  <Label>Email</Label>
                  <Input type="email" placeholder="Email" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`contacts.${index}.phone`}
              render={({ field }) => (
                <FormItem>
                  <Label>Phone</Label>
                  <Input placeholder="Phone Number" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`contacts.${index}.designation`}
              render={({ field }) => (
                <FormItem>
                  <Label>Designation</Label>
                  <Input placeholder="Designation" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      {fields.length === 0 && (
        <div className="p-4 border rounded-md bg-gray-50 text-center text-gray-500">
          No contacts added. Click "Add Contact Person" to add a contact.
        </div>
      )}

      <FormMessage name="contacts" />
    </div>
  );
};

export default ContactList;
