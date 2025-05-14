
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
}

const ClientCandidatesView = () => {
  const { clientName } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (clientName) {
      fetchCandidatesForClient(decodeURIComponent(clientName));
    }
  }, [clientName]);

  const fetchCandidatesForClient = async (client: string) => {
    try {
      setLoading(true);
      
      // First, get all jobs for this client
      const { data: jobsData, error: jobsError } = await supabase
        .from("hr_jobs")
        .select("id, title")
        .eq("client_owner", client);

      if (jobsError) throw jobsError;
      
      if (!jobsData || jobsData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Create an array of job IDs
      const jobIds = jobsData.map(job => job.id);
      
      // Get all candidates for these jobs
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("hr_job_candidates")
        .select("id, name, email, phone, experience, skills, status, job_id")
        .in("job_id", jobIds);
        
      if (candidatesError) throw candidatesError;
      
      // Enhance candidates with job title
      const enhancedCandidates = candidatesData.map(candidate => {
        const job = jobsData.find(job => job.id === candidate.job_id);
        return {
          ...candidate,
          job_title: job ? job.title : "Unknown"
        };
      });
      
      setCandidates(enhancedCandidates);
      setFilteredCandidates(enhancedCandidates);
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

  const goBack = () => {
    navigate("/client-dashboard");
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
              <CardTitle className="text-2xl">{clientName} - Candidates</CardTitle>
              <CardDescription>
                View all candidates associated with {clientName}
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
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Job</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{candidate.phone}</TableCell>
                        <TableCell>{candidate.experience}</TableCell>
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
                        <TableCell>
                          <Badge className={
                            candidate.status === "hired" ? "bg-green-500" :
                            candidate.status === "rejected" ? "bg-red-500" :
                            candidate.status === "pending" ? "bg-yellow-500" :
                            "bg-gray-500"
                          }>
                            {candidate.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>{candidate.job_title}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm ? "No candidates found matching your search." : "No candidates found for this client."}
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
