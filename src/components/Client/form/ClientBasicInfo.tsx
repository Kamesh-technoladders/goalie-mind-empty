
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { UseFormReturn } from "react-hook-form";
import { ClientFormValues } from "@/lib/schemas/client";
import ContactList from "./ContactList";

interface ClientBasicInfoProps {
  form: UseFormReturn<ClientFormValues>;
}

const ClientBasicInfo: React.FC<ClientBasicInfoProps> = ({ form }) => {
  const showCommissionFields = form.watch("service_type")?.includes("permanent");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <FormField
          control={form.control}
          name="service_type"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Type of Service</FormLabel>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="service_type"
                    render={({ field }) => {
                      const selected = field.value || [];
                      return (
                        <div className="flex gap-4">
                          <Checkbox
                            checked={selected.includes('contractual')}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...selected, 'contractual']
                                : selected.filter(v => v !== 'contractual');
                              field.onChange(newValue);
                            }}
                          />
                          <label>Contractual (Internal)</label>
                        </div>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="service_type"
                    render={({ field }) => {
                      const selected = field.value || [];
                      return (
                        <div className="flex gap-4">
                          <Checkbox
                            checked={selected.includes('permanent')}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...selected, 'permanent']
                                : selected.filter(v => v !== 'permanent');
                              field.onChange(newValue);
                            }}
                          />
                          <label>FTE/Permanent Hiring (External)</label>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Display Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Client Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Contact List */}
      <ContactList form={form} />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="INR">₹ (INR)</SelectItem>
                  <SelectItem value="USD">$ (USD)</SelectItem>
                  <SelectItem value="GBP">£ (GBP)</SelectItem>
                  <SelectItem value="EUR">€ (EUR)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="internal_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Contact</FormLabel>
              <FormControl>
                <Input placeholder="Internal Contact" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="payment_terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Payment Terms" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCommissionFields && (
          <>
            <FormField
              control={form.control}
              name="commission_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Commission Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

<FormField
  control={form.control}
  name="commission_value"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Commission Value</FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder={form.watch("commission_type") === "percentage" ? "Commission %" : "Commission Amount"}
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

          </>
        )}
      </div>
    </div>
  );
};

export default ClientBasicInfo;
