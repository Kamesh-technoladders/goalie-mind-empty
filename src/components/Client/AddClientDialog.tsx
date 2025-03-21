
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Form } from "../../components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { clientFormSchema, type ClientFormValues } from "../../lib/schemas/client";
import { toast } from "sonner";
import { supabase } from "../../integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ClientBasicInfo from "./form/ClientBasicInfo";
import ClientAddress from "./form/ClientAddress";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddClientDialog = ({ open, onOpenChange }: AddClientDialogProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const queryClient = useQueryClient();
  const user = useSelector((state: any) => state.auth.user);
  const organization_id = useSelector((state: any) => state.auth.organization_id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      display_name: "",
      client_name: "",
      contacts: [{ name: "", email: "", phone: "", designation: "" }],
      currency: "INR",
      service_type: [],
      payment_terms: 30,
      internal_contact: "",
      billing_address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      shipping_address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (!user || !organization_id) {
        toast.error("Authentication error: Missing user or organization ID");
        return;
      }

      // Create a client object without the contacts array
      const clientData = {
        display_name: values.display_name,
        client_name: values.client_name,
        currency: values.currency,
        service_type: values.service_type,
        payment_terms: values.payment_terms,
        payment_terms_custom: values.payment_terms_custom,
        commission_type: values.commission_type,
        commission_value: values.commission_value,
        internal_contact: values.internal_contact,
        billing_address: values.billing_address,
        shipping_address: values.shipping_address,
        organization_id,
        created_by: user.id,
        updated_by: user.id,
        status: "active"
      };

      // Insert the client and get the new client ID
      const { data: clientResult, error: clientError } = await supabase
        .from("hr_clients")
        .insert(clientData)
        .select("id")
        .single();

      if (clientError) throw clientError;

      const clientId = clientResult.id;
      
      // Insert each contact with the client ID
      const contactsToInsert = values.contacts.map(contact => ({
        client_id: clientId,
        name: contact.name,
        email: contact.email || null,
        phone: contact.phone || null,
        designation: contact.designation || null
      }));

      const { error: contactsError } = await supabase
        .from("hr_client_contacts")
        .insert(contactsToInsert);

      if (contactsError) throw contactsError;

      toast.success("Client added successfully");
      queryClient.invalidateQueries({ queryKey: ["hr_clients"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Client Details</TabsTrigger>
                <TabsTrigger value="address">Address Information</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 mt-4">
                <ClientBasicInfo form={form} />
              </TabsContent>
              <TabsContent value="address" className="space-y-4 mt-4">
                <ClientAddress form={form} />
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Client</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
