
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../config/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Client {
  id: string;
  display_name: string;
  client_name: string;
  service_type: string[];
  status: string;
}

const ClientManagementDashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("All");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hr_clients")
        .select("id, display_name, client_name, service_type, status");

      if (error) {
        throw error;
      }

      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch client data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setServiceTypeFilter(value);
    
    if (value === "All") {
      setFilteredClients(clients);
      return;
    }
    
    const filtered = clients.filter(client => {
      const serviceTypes = client.service_type || [];
      
      if (value === "Permanent") {
        return serviceTypes.includes("Permanent");
      }
      
      if (value === "Contractual") {
        return serviceTypes.includes("Contractual");
      }
      
      if (value === "Both") {
        return serviceTypes.includes("Permanent") && serviceTypes.includes("Contractual");
      }
      
      return true;
    });
    
    setFilteredClients(filtered);
  };

  const navigateToCandidates = (clientName: string) => {
    navigate(`/client-dashboard/${encodeURIComponent(clientName)}/candidates`);
  };

  const navigateToOfferedJoined = () => {
    navigate("/client-dashboard/offered-joined");
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Client Dashboard</CardTitle>
              <CardDescription>
                View and manage your clients
              </CardDescription>
            </div>
            <Button 
              onClick={navigateToOfferedJoined}
              variant="outline"
            >
              View Offered & Joined Candidates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="mr-4">
              <label htmlFor="filter" className="mr-2 text-sm font-medium">
                Filter by Service Type:
              </label>
              <Select
                value={serviceTypeFilter}
                onValueChange={handleFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Contractual">Contractual</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell 
                          className="font-medium cursor-pointer hover:text-primary"
                          onClick={() => navigateToCandidates(client.client_name)}
                        >
                          {client.display_name}
                        </TableCell>
                        <TableCell>{client.client_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {client.service_type && client.service_type.length > 0 ? (
                              client.service_type.map((service, index) => (
                                <Badge key={index} variant="outline">
                                  {service}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">Not specified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            client.status === "active" ? "bg-green-500" : 
                            client.status === "inactive" ? "bg-red-500" : 
                            "bg-gray-500"
                          }>
                            {client.status || "Unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No clients found matching your filter criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientManagementDashboard;
