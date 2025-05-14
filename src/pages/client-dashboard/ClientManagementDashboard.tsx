
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeFilter, setActiveFilter] = useState("all");
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

      if (data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (error) {
      toast({
        title: "Error fetching clients",
        description: "An error occurred while fetching client data.",
        variant: "destructive",
      });
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = (filter: string) => {
    setActiveFilter(filter);
    
    if (filter === "all") {
      setFilteredClients(clients);
      return;
    }
    
    const filtered = clients.filter((client) => {
      if (filter === "both") {
        return (
          client.service_type &&
          client.service_type.includes("permanent") &&
          client.service_type.includes("contractual")
        );
      }
      
      return client.service_type && client.service_type.includes(filter);
    });
    
    setFilteredClients(filtered);
  };

  const handleClientClick = (clientName: string) => {
    navigate(`/client-dashboard/${encodeURIComponent(clientName)}/candidates`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "inactive":
        return "bg-red-500 hover:bg-red-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Client Dashboard</CardTitle>
          <CardDescription>
            View and manage your clients. Click on a client to see associated candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeFilter} onValueChange={filterClients}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="permanent">Permanent</TabsTrigger>
              <TabsTrigger value="contractual">Contractual</TabsTrigger>
              <TabsTrigger value="both">Both</TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleClientClick(client.client_name)}>
                          <TableCell className="font-medium">{client.id.substring(0, 8)}...</TableCell>
                          <TableCell className="font-medium text-purple">{client.display_name}</TableCell>
                          <TableCell>{client.client_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {client.service_type ? (
                                client.service_type.map((type, index) => (
                                  <Badge key={index} variant="outline" className="capitalize">
                                    {type}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(client.status)}>
                              {client.status || "Unknown"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No clients found matching the selected filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientManagementDashboard;
