import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import HiddenContactCell from "@/components/ui/HiddenContactCell";

// Status IDs for Offered and Joined candidates
const OFFERED_STATUS_ID = "9d48d0f9-8312-4f60-aaa4-bafdce067417";
const JOINED_STATUS_ID = "5b4e0b82-0774-4e3b-bb1e-96bc2743f96e";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  skills: string[];
  status: string;
  job_id: string;
  job_title?: string;
  main_status_id?: string;
  sub_status_id?: string;
  ctc?: number;
  accrual_ctc?: number;
  profit?: number;
}

interface Job {
  id: string;
  title: string;
  client_owner: string;
  job_type_category: string;
  budget?: number;
  budget_type?: string;
}

interface Client {
  id: string;
  client_name: string;
  commission_value?: number;
  commission_type?: string;
}

const ClientCandidatesView = () => {
  const { clientName } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalProfit, setTotalProfit] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (clientName) {
      fetchCandidatesForClient(decodeURIComponent(clientName));
    }
  }, [clientName]);

  const calculateProfit = (
    candidate: Candidate,
    job: Job,
    client: Client
  ): number => {
    // Determine the salary (use ctc or accrual_ctc)
    const salary = candidate.ctc || candidate.accrual_ctc || 0;
    
    if (job.job_type_category === "Internal") {
      // Internal job profit calculation
      let budget = job.budget || 0;
      
      // Convert budget based on budget_type
      if (job.budget_type === "Monthly") {
        budget = budget * 12; // Convert monthly to LPA
      } else if (job.budget_type === "Hourly") {
        budget = budget * 2080; // Convert hourly to LPA (40 hours/week * 52 weeks)
      }
      
      return budget - salary;
    } else {
      // External job profit calculation
      if (client.commission_type === "percentage" && client.commission_value) {
        return (salary * client.commission_value) / 100;
      } else if (client.commission_type === "fixed" && client.commission_value) {
        return client.commission_value;
      }
    }
    
    return 0;
  };

  const fetchCandidatesForClient = async (client: string) => {
    try {
      setLoading(true);
      
      // First, get client details for commission info
      const { data: clientData, error: clientError } = await supabase
        .from("hr_clients")
        .select("id, client_name, commission_value, commission_type")
        .eq("client_name", client)
        .single();

      if (clientError) throw clientError;
      
      // Next, get all jobs for this client
      const { data: jobsData, error: jobsError } = await supabase
        .from("hr_jobs")
        .select("id, title, client_owner, job_type_category, budget, budget_type")
        .eq("client_owner", client);

      if (jobsError) throw jobsError;
      
      if (!jobsData || jobsData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Create an array of job IDs
      const jobIds = jobsData.map(job => job.id);
      
      // Get candidates with specific status IDs (Offered or Joined)
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("hr_job_candidates")
        .select(`
          id, name, email, phone, experience, skills, status, job_id,
          main_status_id, sub_status_id, ctc, accrual_ctc
        `)
        .in("job_id", jobIds)
        .in("main_status_id", [OFFERED_STATUS_ID, JOINED_STATUS_ID]);
        
      if (candidatesError) throw candidatesError;
      
      if (!candidatesData || candidatesData.length === 0) {
        setCandidates([]);
        setFilteredCandidates([]);
        setTotalProfit(0);
        setLoading(false);
        return;
      }
      
      // Enhance candidates with job title and profit calculation
      const enhancedCandidates = candidatesData.map(candidate => {
        const job = jobsData.find(job => job.id === candidate.job_id);
        const profit = job ? calculateProfit(candidate, job, clientData) : 0;
        
        return {
          ...candidate,
          job_title: job ? job.title : "Unknown",
          profit
        };
      });
      
      // Calculate total profit
      const totalCalculatedProfit = enhancedCandidates.reduce(
        (sum, candidate) => sum + (candidate.profit || 0),
        0
      );
      
      setCandidates(enhancedCandidates);
      setFilteredCandidates(enhancedCandidates);
      setTotalProfit(totalCalculatedProfit);
    } catch (error) {
      toast({
        title: "Error fetching candidates",
        description: "An error occurred while fetching candidate data.",
        variant: "destructive",
      });
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    
    const searchTermLower = value.toLowerCase();
    const filtered = candidates.filter(
      candidate =>
        candidate.name.toLowerCase().includes(searchTermLower) ||
        candidate.email.toLowerCase().includes(searchTermLower) ||
        candidate.phone?.toLowerCase().includes(searchTermLower) ||
        candidate.skills?.some(skill => 
          skill.toLowerCase().includes(searchTermLower)
        )
    );
    
    setFilteredCandidates(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const goBack = () => {
    navigate("/client-dashboard");
  };

  const getStatusBadgeColor = (statusId: string | undefined) => {
    switch (statusId) {
      case OFFERED_STATUS_ID:
        return "bg-yellow-500";
      case JOINED_STATUS_ID:
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (statusId: string | undefined) => {
    switch (statusId) {
      case OFFERED_STATUS_ID:
        return "Offered";
      case JOINED_STATUS_ID:
        return "Joined";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={goBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">{clientName} - Candidates (Offered & Joined)</CardTitle>
              <CardDescription>
                View all offered and joined candidates for {clientName} with profit calculations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Search candidates..." 
              className="pl-8" 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="mb-4 bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">Total Profit:</span>
              <span className="font-bold text-green-800">{formatCurrency(totalProfit)}</span>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Salary (LPA)</TableHead>
                    <TableHead>Profit (INR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <HiddenContactCell 
                          email={candidate.email} 
                          phone={candidate.phone} 
                          candidateId={candidate.id}
                        />
                        <TableCell>{candidate.experience || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills && candidate.skills.length > 0 ? (
                              candidate.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline">
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                            {candidate.skills && candidate.skills.length > 3 && (
                              <Badge variant="outline">+{candidate.skills.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{candidate.job_title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(candidate.main_status_id)}>
                            {getStatusText(candidate.main_status_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(candidate.ctc || candidate.accrual_ctc) 
                            ? formatCurrency(candidate.ctc || candidate.accrual_ctc || 0)
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className={candidate.profit && candidate.profit > 0 ? "text-green-600" : "text-red-600"}>
                            {candidate.profit ? formatCurrency(candidate.profit) : "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {searchTerm 
                          ? "No candidates found matching your search." 
                          : "No offered or joined candidates found for this client."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'} found
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ClientCandidatesView;
