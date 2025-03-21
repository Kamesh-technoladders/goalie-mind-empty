
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ClientFormValues } from "@/lib/schemas/client";
import { Checkbox } from "../../ui/checkbox";
import AddressFields from "./AddressFields";

interface ClientAddressProps {
  form: UseFormReturn<ClientFormValues>;
}

const ClientAddress: React.FC<ClientAddressProps> = ({ form }) => {
  const copyBillingToShipping = () => {
    const billingAddress = form.getValues("billing_address");
    form.setValue("shipping_address", billingAddress);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Billing Address</h3>
        <AddressFields form={form} type="billing" />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="copy-address" onCheckedChange={(checked) => checked && copyBillingToShipping()} />
        <label htmlFor="copy-address" className="text-sm text-muted-foreground">
          Copy Billing Address to Shipping Address
        </label>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
        <AddressFields form={form} type="shipping" />
      </div>
    </div>
  );
};

export default ClientAddress;
