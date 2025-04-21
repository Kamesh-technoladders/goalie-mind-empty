import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import supabase from "@/config/supabaseClient";
import { toast } from "sonner";

interface AssociateToClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobData;
  onAssociate: (updatedJob: JobData) => Promise<void>;
}

interface Client {
  id: string;
  client_name: string;
  service_type: string[];
}

interface ClientProject {
  id: string;
  name: string;
  client_id: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  client_id: string;
}

const AssociateToClientModal = ({ 
  isOpen, 
  onClose, 
  job, 
  onAssociate 
}: AssociateToClientModalProps) => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [budgetType, setBudgetType] = useState<string>("LPA");
  const [budget, setBudget] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [isInternPaid, setIsInternPaid] = useState<string>("Paid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch clients with service type "Contractual" or "Permanent"
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-permanent-contractual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_clients')
        .select('id, client_name, service_type');
      
      if (error) throw error;
      return data as Client[];
    }
  });
  
  // Filter clients based on service_type
  const filteredClients = clients.filter(client => 
    client.service_type.includes("permanent") || 
    client.service_type.includes("contractual")
  );
  
  // Fetch projects for selected client
  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ['client-projects', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from('hr_projects')
        .select('id, name, client_id')
        .eq('client_id', selectedClient);
      
      if (error) throw error;
      return data as ClientProject[];
    },
    enabled: !!selectedClient,
  });
  
  // Fetch contacts for selected client
  const { data: contacts = [], refetch: refetchContacts } = useQuery({
    queryKey: ['client-contacts', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from('hr_client_contacts')
        .select('id, name, email, phone, designation, client_id')
        .eq('client_id', selectedClient);
      
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!selectedClient,
  });
  
  // Initialize form with existing client details only on modal open
  useEffect(() => {
    if (isOpen && isInitialMount.current) {
      if (job.clientDetails?.clientName) {
        const client = clients.find(c => c.client_name === job.clientDetails.clientName);
        if (client) {
          setSelectedClient(client.id);
          
          // Parse budget
          if (job.clientDetails.clientBudget) {
            const [amount, type] = job.clientDetails.clientBudget.split(' ');
            setBudget(amount || '');
            setBudgetType(type || 'LPA');
          }
          
          // Set project
          setSelectedProject(job.clientProjectId || '');
        }
      }
      isInitialMount.current = false;
    }
    
    // Reset flag when modal closes
    if (!isOpen) {
      isInitialMount.current = true;
      setSelectedClient('');
      setBudget('');
      setBudgetType('LPA');
      setSelectedProject('');
      setSelectedContact('');
    }
  }, [isOpen, job.clientDetails, clients, job.clientProjectId]);
  
  // Set contact after contacts are loaded
  useEffect(() => {
    if (selectedClient && contacts.length > 0 && job.clientDetails?.pointOfContact) {
      const contact = contacts.find(c => c.name === job.clientDetails.pointOfContact);
      setSelectedContact(contact ? contact.id : '');
    }
  }, [contacts, selectedClient, job.clientDetails]);
  
  // Set budget type based on hiring mode
  useEffect(() => {
    if (job.hiringMode === "Full Time" || job.hiringMode === "Permanent") {
      setBudgetType("LPA");
    } else if (job.hiringMode === "Intern") {
      setBudgetType(isInternPaid === "Paid" ? "Stipend" : "Unpaid");
    } else {
      setBudgetType("Monthly");
    }
  }, [job.hiringMode, isInternPaid]);
  
  // Reset dependent fields when client changes
  useEffect(() => {
    setSelectedProject("");
    setSelectedContact("");
    if (selectedClient) {
      refetchProjects();
      refetchContacts();
    }
  }, [selectedClient, refetchProjects, refetchContacts]);
  
  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!selectedClient) {
        toast.error("Please select a client");
        return;
      }
      
      if (!budget && budgetType !== "Unpaid") {
        toast.error("Please enter a budget");
        return;
      }
      
      // Get client name from the selected client
      const client = clients.find(c => c.id === selectedClient);
      
      if (!client) {
        toast.error("Selected client not found");
        return;
      }
      
      // Get selected contact details
      const contact = contacts.find(c => c.id === selectedContact);
      
      // Create updated job object
      const updatedJob: JobData = {
        ...job,
        submissionType: "Client",
        clientOwner: client.client_name,
        clientDetails: {
          ...job.clientDetails,
          clientName: client.client_name,
          clientBudget: budgetType === "Unpaid" ? "Unpaid" : `${budget} ${budgetType}`,
          pointOfContact: contact ? contact.name : ''
        },
        clientProjectId: selectedProject || undefined
      };
      
      // Call the onAssociate callback with the updated job
      await onAssociate(updatedJob);
      
      toast.success("Job successfully associated with client");
      onClose();
    } catch (error) {
      console.error("Error associating job with client:", error);
      toast.error("Failed to associate job with client");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getBudgetTypeOptions = () => {
    if (job.hiringMode === "Full Time") {
      return ["LPA"];
    } else if (job.hiringMode === "Contract" || job.hiringMode === "Part Time") {
      return ["Monthly", "Hourly"];
    } else if (job.hiringMode === "Intern") {
      if (isInternPaid === "Paid") {
        return ["Stipend"];
      } else {
        return ["Unpaid"];
      }
    }
    return ["LPA"];
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Associate Job to Client</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Select Client <span className="text-red-500">*</span></Label>
            <Select
              value={selectedClient}
              onValueChange={handleClientChange}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {job.hiringMode === "Intern" && (
            <div className="space-y-2">
              <Label>Internship Type <span className="text-red-500">*</span></Label>
              <Select value={isInternPaid} onValueChange={setIsInternPaid}>
                <SelectTrigger id="internType">
                  <SelectValue placeholder="Select internship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {budgetType !== "Unpaid" && (
            <div className="space-y-2">
              <Label htmlFor="budget">
                {budgetType === "Stipend" ? "Stipend (Monthly)" : "Budget"} <span className="text-red-500">*</span>
              </Label>
              <div className="flex">
                <Input
                  id="budget"
                  type="text"
                  placeholder={`Enter ${budgetType === "Stipend" ? "stipend" : "budget"} amount`}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="rounded-r-none"
                />
                <Select 
                  value={budgetType} 
                  onValueChange={setBudgetType}
                  disabled={getBudgetTypeOptions().length <= 1}
                >
                  <SelectTrigger className="w-[110px] rounded-l-none border-l-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getBudgetTypeOptions().map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {selectedClient && (
            <>
              <div className="space-y-2">
                <Label htmlFor="project">Client Project (Optional)</Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select an existing project or leave blank
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">SPOC Contact (Optional)</Label>
                <Select
                  value={selectedContact}
                  onValueChange={setSelectedContact}
                >
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}{contact.email ? ` (${contact.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Select a contact person or leave blank
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign to Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssociateToClientModal;