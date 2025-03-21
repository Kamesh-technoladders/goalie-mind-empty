import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus, 
  Search, 
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  Loader2,
  HousePlus
} from "lucide-react";
import { Button } from "@/components/jobs/ui/button";
import { Input } from "@/components/jobs/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/jobs/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/jobs/ui/select";
import { Badge } from "@/components/jobs/ui/badge";
import { Card } from "@/components/jobs/ui/card";
import { CreateJobModal } from "@/components/jobs/CreateJobModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/jobs/ui/tooltip";
import { AssignJobModal } from "@/components/jobs/job/AssignJobModal";
import { toast } from "sonner";
import { JobData } from "@/lib/types";
import { 
  getAllJobs,
  getJobsByType,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus
} from "@/services/jobService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/jobs/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/jobs/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/jobs/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import AssociateToClientModal from "@/components/jobs/job/AssociateToClientModal";



const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobData | null>(null);
  const [mockJobs, setMockJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [clientselectedJob, setClientSelectedJob] = useState<JobData | null>(null);
  

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        let jobs: JobData[];
        
        if (activeTab === "all") {
          jobs = await getAllJobs();
        } else {
          jobs = await getJobsByType(activeTab === "staffing" ? "Staffing" : "Augment Staffing");
        }
        
        setMockJobs(jobs);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to load jobs:", error);
        toast.error("Failed to load jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [activeTab]);

  // const filteredJobs = mockJobs.filter((job) => {
  //   if (
  //     searchQuery &&
  //     !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
  //     !job.department.toLowerCase().includes(searchQuery.toLowerCase()) &&
  //     !job.jobId.toLowerCase().includes(searchQuery.toLowerCase()) &&
  //     !job.clientOwner.toLowerCase().includes(searchQuery.toLowerCase()) &&
  //     !job.location.some(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()))
  //   ) {
  //     return false;
  //   }

  //   for (const [key, value] of Object.entries(filters)) {
  //     if (value && 
  //        (key === 'location' 
  //          ? !job.location.some(loc => loc.includes(value))
  //          : job[key as keyof typeof job] !== value)
  //     ) {
  //       return false;
  //     }
  //   }

  //   return true;
  // });
  const { 
    data: jobs = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: getAllJobs,
  });
  
  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch jobs");
      console.error("Error fetching jobs:", error);
    }
  }, [error]);



  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "internal") return matchesSearch && job.jobType === "Internal";
    if (activeTab === "external") return matchesSearch && job.jobType === "External";
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  const activeJobs = mockJobs.filter(job => job.status === "Active" || job.status === "OPEN").length;
  const pendingJobs = mockJobs.filter(job => job.status === "Pending" || job.status === "HOLD").length;
  const completedJobs = mockJobs.filter(job => job.status === "Completed" || job.status === "CLOSE").length;
  const totalJobs = mockJobs.length;

  const handleAssignJob = (job: JobData) => {
    setSelectedJob(job);
    setIsAssignModalOpen(true);
  };

  const handleEditJob = (job: JobData) => {
    setEditJob(job); // Set the job to edit
    setIsCreateModalOpen(true); // Open the modal
  };

  const handleDeleteJob = (job: JobData) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      setStatusUpdateLoading(jobId);
      const updatedJob = await updateJobStatus(jobId, newStatus);
      
      setMockJobs(jobs => jobs.map(job => job.id === jobId ? updatedJob : job));
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status. Please try again.");
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  console.log("jobssssssss::", jobs)

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    
    try {
      setActionLoading(true);
      await deleteJob(jobToDelete.id.toString());
      
      setMockJobs(jobs => jobs.filter(job => job.id !== jobToDelete.id));
      toast.success("Job deleted successfully");
      
      if (paginatedJobs.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job. Please try again.");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleSaveJob = async (jobData: JobData) => {
    try {
      setActionLoading(true);
      let savedJob: JobData;
      
      if (mockJobs.some(job => job.id === jobData.id)) {
        savedJob = await updateJob(jobData.id.toString(), jobData);
        toast.success("Job updated successfully");
        
        setMockJobs(prev => prev.map(job => job.id === savedJob.id ? savedJob : job));
      } else {
        savedJob = await createJob(jobData);
        toast.success("Job created successfully");
        
        setMockJobs(prev => [savedJob, ...prev]);
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(editJob ? "Failed to update job" : "Failed to create job");
    } finally {
      setActionLoading(false);
      setEditJob(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditJob(null);
  };

  // New Changes

  
  const handleCreateNewJob = async (newJob: JobData) => {
    try {
      if (editJob) {
        // If editing, update the job
        await updateJob(editJob.id.toString(), newJob);
        toast.success("Job updated successfully");
      } else {
        // If creating, add a new job
        await createJob(newJob);
        toast.success("Job created successfully");
      }
      await refetch(); // Refetch jobs to update the list
      setIsCreateModalOpen(false); // Close the modal
      setEditJob(null); // Reset the edit job state
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(editJob ? "Failed to update job" : "Failed to create job");
    }
  };
  
  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    try {
      await updateJobStatus(jobId, status);
      refetch();
      toast.success(`Job status updated to ${status}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    }
  };
  
  const openAssociateModal = (job: JobData) => {
    setClientSelectedJob(job);
    setAssociateModalOpen(true);
  };
  
  const handleAssociateToClient = async (updatedJob: JobData) => {
    try {
      // Call the update job function with the job ID and updated job data
      await updateJob(updatedJob.id, updatedJob);
      
      // Refetch jobs to get the updated list
      await refetch();
      
      toast.success("Job successfully associated with client");
    } catch (error) {
      console.error("Error associating job with client:", error);
      toast.error("Failed to associate job with client");
    }
  };
  


  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "OPEN":
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "HOLD":
      case "Pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "CLOSE":
      case "Completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-xl text-gray-500">Loading jobs...</span>
      </div>
    );
  }

  const renderTable = (jobs: JobData[]) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    if (jobs.length === 0) {
      return (
        <div className="text-center p-12 text-gray-500">
          <p>No jobs found.</p>
        </div>
      );
    }
  
    return (
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-scale-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="table-header-cell">
                  <div className="flex items-center gap-1">
                    Job Title
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th scope="col" className="table-header-cell">Client Owner</th>
                <th scope="col" className="table-header-cell">Created Date</th>
                <th scope="col" className="table-header-cell">Submission</th>
                <th scope="col" className="table-header-cell">Status</th>
                <th scope="col" className="table-header-cell">Assigned To</th>
                <th scope="col" className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition">
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.title}</span>
                      <span className="text-xs text-gray-500">
                        {job.jobId}, {job.hiringMode}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">{job.clientOwner}</td>
                  <td className="table-cell">{job.postedDate}</td>
                  <td className="table-cell">
                    <Badge
                      variant="outline"
                      className={`
                        ${job.submissionType === "Internal" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}
                        ${job.submissionType === "Client" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : ""}
                      `}
                    >
                      {job.submissionType}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 px-2 py-0">
                          {statusUpdateLoading === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Badge
                              variant="outline"
                              className={getStatusBadgeClass(job.status)}
                            >
                              {job.status}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem 
                          className="text-green-600 focus:text-green-600 focus:bg-green-50"
                          onClick={() => handleStatusChange(job.id, "OPEN")}
                        >
                          OPEN
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50"
                          onClick={() => handleStatusChange(job.id, "HOLD")}
                        >
                          HOLD
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                          onClick={() => handleStatusChange(job.id, "CLOSE")}
                        >
                          CLOSE
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="table-cell">
                    {job.assignedTo ? (
                      <span>{job.assignedTo.name}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not assigned</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/jobs/${job.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditJob(job)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleAssignJob(job)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Assign Job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {job.jobType === "Internal" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openAssociateModal(job)}
                            >
                              <HousePlus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Associate to Client</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteJob(job)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Job</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Job Dashboard</h1>
          <p className="text-gray-500">Manage and track all job postings</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Create New Job</span>
        </Button>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Jobs</p>
              <h3 className="text-3xl font-bold">{filteredJobs.length}</h3>
              <p className="text-xs text-gray-500 mt-1">All departments</p>
            </div>
            <div className="stat-icon stat-icon-blue">
              <Briefcase size={22} />
            </div>
          </div>
        </Card>
  
        <Card className="stat-card animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Jobs</p>
              <h3 className="text-3xl font-bold">{filteredJobs.filter(job => job.status === "Active" || job.status === "OPEN").length}</h3>
              <p className="text-xs text-gray-500 mt-1">{Math.round((filteredJobs.filter(job => job.status === "Active" || job.status === "OPEN").length / filteredJobs.length) * 100) || 0}% of total</p>
            </div>
            <div className="stat-icon stat-icon-green">
              <Calendar size={22} />
            </div>
          </div>
        </Card>
  
        <Card className="stat-card animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Jobs</p>
              <h3 className="text-3xl font-bold">{filteredJobs.filter(job => job.status === "Pending" || job.status === "HOLD").length}</h3>
              <p className="text-xs text-gray-500 mt-1">{Math.round((filteredJobs.filter(job => job.status === "Pending" || job.status === "HOLD").length / filteredJobs.length) * 100) || 0}% of total</p>
            </div>
            <div className="stat-icon stat-icon-yellow">
              <Clock size={22} />
            </div>
          </div>
        </Card>
  
        <Card className="stat-card animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completed Jobs</p>
              <h3 className="text-3xl font-bold">{filteredJobs.filter(job => job.status === "Completed" || job.status === "CLOSE").length}</h3>
              <p className="text-xs text-gray-500 mt-1">{Math.round((filteredJobs.filter(job => job.status === "Completed" || job.status === "CLOSE").length / filteredJobs.length) * 100) || 0}% of total</p>
            </div>
            <div className="stat-icon stat-icon-purple">
              <CheckCircle size={22} />
            </div>
          </div>
        </Card>
      </div>
  
  
  
     
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full sm:w-80">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="internal" className="flex items-center gap-1">
            <Briefcase size={14} />
            <span>Internal</span>
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-1">
            <Users size={14} />
            <span>External</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Input */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search for jobs..."
          className="pl-10 h-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            <span>Filters</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Jobs</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Filter options remain unchanged */}
          </div>
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setFilters({})}
            >
              Reset Filters
            </Button>
            <Button type="submit">Apply Filters</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    {/* Tabs Content */}
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsContent value="all" className="space-y-6">
        {renderTable(filteredJobs)}
      </TabsContent>

      <TabsContent value="internal" className="space-y-6">
        {renderTable(filteredJobs.filter(job => job.jobType === "Internal"))}
      </TabsContent>

      <TabsContent value="external" className="space-y-6">
        {renderTable(filteredJobs.filter(job => job.jobType === "External"))}
      </TabsContent>
    </Tabs>

  
  <CreateJobModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditJob(null); // Reset the edit job state when closing the modal
        }}
        onSave={handleCreateNewJob}
        editJob={editJob} // Pass the job to edit
      />
      
      <AssignJobModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        job={selectedJob}
      />
  
      {clientselectedJob && (
        <AssociateToClientModal
          isOpen={associateModalOpen}
          onClose={() => setAssociateModalOpen(false)}
          job={clientselectedJob}
          onAssociate={handleAssociateToClient}
        />
      )}
  
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job "{jobToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteJob}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Jobs;
