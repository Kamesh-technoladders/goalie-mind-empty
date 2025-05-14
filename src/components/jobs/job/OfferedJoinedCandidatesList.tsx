
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import supabase from "@/config/supabaseClient";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import moment from 'moment';
import { HiddenContactCell } from "@/components/ui/HiddenContactCell";

// Status IDs for Offered and Joined candidates
const OFFERED_STATUS_ID = "9d48d0f9-8312-4f60-aaa4-bafdce067417";
const JOINED_STATUS_ID = "5b4e0b82-0774-4e3b-bb1e-96bc2743f96e";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  applied_date: string;
  ctc?: number;
  accrual_ctc?: number;
  main_status_id: string;
  sub_status_id?: string;
  resume_url?: string;
  status?: string;
  job_id?: string;
  created_at?: string;
  profit?: number;
  job_title?: string;
  budget_type?: string;
  job_type_category?: string;
  client_budget?: number;
  commission_value?: number;
  commission_type?: string;
}

interface Job {
  id: string;
  title: string;
  client_owner: string;
  budget: number;
  budget_type: string;
  job_type_category: string;
}

interface Client {
  id: string;
  client_name: string;
  commission_value: number;
  commission_type: string;
}

const OfferedJoinedCandidatesList = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchOfferedJoinedCandidates();
  }, []);

  const fetchOfferedJoinedCandidates = async () => {
    try {
      setLoading(true);
      
      // Fetch candidates with Offered or Joined status
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("hr_job_candidates")
        .select("id, name, email, phone, experience, applied_date, ctc, accrual_ctc, main_status_id, sub_status_id, resume_url, status, job_id, created_at")
        .in("main_status_id", [OFFERED_STATUS_ID, JOINED_STATUS_ID]);
      
      if (candidatesError) throw candidatesError;
      
      if (!candidatesData || candidatesData.length === 0) {
        setLoading(false);
        setCandidates([]);
        setFilteredCandidates([]);
        return;
      }
      
      // Get the jobs for these candidates
      const jobIds = candidatesData.map(candidate => candidate.job_id).filter(Boolean);
      
      if (jobIds.length === 0) {
        setLoading(false);
        setCandidates([]);
        setFilteredCandidates([]);
        return;
      }
      
      const { data: jobsData, error: jobsError } = await supabase
        .from("hr_jobs")
        .select("id, title, client_owner, budget, budget_type, job_type_category")
        .in("id", jobIds);
        
      if (jobsError) throw jobsError;
      
      // Get clients for these jobs
      const clientNames = jobsData
        .map(job => job.client_owner)
        .filter(Boolean);
      
      let clientsData: Client[] = [];
      
      if (clientNames.length > 0) {
        const { data: fetchedClientsData, error: clientsError } = await supabase
          .from("hr_clients")
          .select("id, client_name, commission_value, commission_type")
          .in("client_name", clientNames);
          
        if (clientsError) throw clientsError;
        clientsData = fetchedClientsData;
      }
      
      // Associate jobs with candidates and calculate profit
      const enhancedCandidates = candidatesData.map(candidate => {
        const job = jobsData.find(job => job.id === candidate.job_id);
        
        // Default values
        let profit = 0;
        let calculatedSalary = 0;
        let calculatedBudget = 0;
        
        if (job) {
          // Find the client for this job
          const client = clientsData.find(client => client.client_name === job.client_owner);
          
          // Get salary (CTC) - if ctc is not available, use accrual_ctc
          const salary = candidate.ctc || candidate.accrual_ctc || 0;
          
          // Convert salary based on budget_type
          if (salary > 0) {
            if (job.budget_type === "Monthly") {
              calculatedSalary = salary * 12; // Convert monthly to LPA
            } else if (job.budget_type === "Hourly") {
              calculatedSalary = salary * 2080; // Convert hourly to LPA (40 hours/week * 52 weeks)
            } else {
              calculatedSalary = salary; // Already in LPA
            }
            
            // Get budget and convert based on budget_type
            if (job.budget) {
              if (job.budget_type === "Monthly") {
                calculatedBudget = job.budget * 12; // Convert monthly to LPA
              } else if (job.budget_type === "Hourly") {
                calculatedBudget = job.budget * 2080; // Convert hourly to LPA
              } else {
                calculatedBudget = job.budget; // Already in LPA
              }
            }
            
            // Calculate profit based on job type and client commission
            if (job.job_type_category === "External" && client && client.commission_value) {
              if (client.commission_type === "percentage") {
                profit = (calculatedSalary * client.commission_value) / 100;
              } else {
                profit = client.commission_value; // Fixed amount
              }
            } else {
              // Internal job - profit is difference between budget and salary
              profit = calculatedBudget - calculatedSalary;
            }
          }
          
          return {
            ...candidate,
            job_title: job.title,
            profit: profit > 0 ? profit : 0, // Ensure profit is not negative
            budget_type: job.budget_type,
            job_type_category: job.job_type_category,
            client_budget: calculatedBudget,
            commission_value: client?.commission_value,
            commission_type: client?.commission_type
          };
        }
        
        return candidate;
      });
      
      setCandidates(enhancedCandidates);
      setFilteredCandidates(enhancedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to fetch candidates data.");
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
        candidate.name?.toLowerCase().includes(searchTermLower) ||
        candidate.email?.toLowerCase().includes(searchTermLower) ||
        candidate.phone?.toLowerCase().includes(searchTermLower) ||
        candidate.job_title?.toLowerCase().includes(searchTermLower)
    );
    
    setFilteredCandidates(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Render pagination component
  const renderPagination = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">per page</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              )
              .map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <span className="text-sm text-gray-600">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + itemsPerPage, filteredCandidates.length)} of{" "}
          {filteredCandidates.length} candidates
        </span>
      </div>
    );
  };

  // Get status display
  const getStatusDisplay = (statusId: string) => {
    if (statusId === OFFERED_STATUS_ID) return "Offered";
    if (statusId === JOINED_STATUS_ID) return "Joined";
    return "Unknown";
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Offered & Joined Candidates</CardTitle>
          <CardDescription>
            View candidates with Offered or Joined status and their calculated profit
          </CardDescription>
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
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Candidate Name</TableHead>
                    <TableHead className="w-[100px]">Contact Info</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[150px]">Job Title</TableHead>
                    <TableHead className="w-[100px]">Job Type</TableHead>
                    <TableHead className="w-[100px]">Salary (LPA)</TableHead>
                    <TableHead className="w-[130px]">Client Budget</TableHead>
                    <TableHead className="w-[130px]">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCandidates.length > 0 ? (
                    paginatedCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{candidate.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {moment(candidate.created_at).format("DD MMM YYYY")} ({moment(candidate.created_at).fromNow()})
                            </span>
                          </div>
                        </TableCell>
                        <HiddenContactCell 
                          email={candidate.email} 
                          phone={candidate.phone}
                          candidateId={candidate.id}
                        />
                        <TableCell>
                          <Badge className={
                            candidate.main_status_id === JOINED_STATUS_ID ? "bg-green-500" : 
                            candidate.main_status_id === OFFERED_STATUS_ID ? "bg-yellow-500" : 
                            "bg-gray-500"
                          }>
                            {getStatusDisplay(candidate.main_status_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>{candidate.job_title || "N/A"}</TableCell>
                        <TableCell>{candidate.job_type_category || "N/A"}</TableCell>
                        <TableCell>
                          {(candidate.ctc || candidate.accrual_ctc) 
                            ? formatCurrency(candidate.ctc || candidate.accrual_ctc || 0) 
                            : "N/A"}
                        </TableCell>
                        <TableCell>{candidate.client_budget ? formatCurrency(candidate.client_budget) : "N/A"}</TableCell>
                        <TableCell className="font-bold">
                          {candidate.profit !== undefined 
                            ? formatCurrency(candidate.profit)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {searchTerm ? "No candidates found matching your search." : "No offered or joined candidates found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {filteredCandidates.length > 0 && (
          <CardFooter>
            {renderPagination()}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default OfferedJoinedCandidatesList;
