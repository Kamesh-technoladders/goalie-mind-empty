
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import ClientTable from "../components/Client/ClientTable";
import { useNavigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import supabase from "@/config/supabaseClient";

// Define the Client interface to match the expected format
interface Client {
  id: string;
  client_name: string;
  email: string;
  phone_number: string;
  status: string;
  client_type: string;
  created_at: string;
  display_name: string;
}

const Client = () => {
  const { role } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from("hr_clients")
          .select("*");
          
        if (error) throw error;
        
        // Transform data to match the Client interface
        const formattedClients: Client[] = (data || []).map((client) => ({
          id: client.id,
          client_name: client.client_name || '',
          email: client.email || '',
          phone_number: client.phone_number || '',
          status: client.status || 'active',
          client_type: client.client_type || '',
          created_at: client.created_at || '',
          display_name: client.client_name || client.id,
        }));
        
        setClients(formattedClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, []);
  
  // For development, bypass role checks
  const hasAccess = true; // In production this would check roles
  
  if (!hasAccess) {
    return <div>Unauthorized Access</div>;
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Client Management</h1>
        <Button colorScheme="blue" onClick={() => navigate("/add-client")}>
          + Add Client
        </Button>
      </div>
      <ClientTable data={clients} />
    </div>
  );
};

export default Client;
