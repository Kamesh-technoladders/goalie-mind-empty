
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Team {
  id: string;
  name: string;
  description?: string;
  team_lead_name?: string;
  department_name?: string;
  member_count: number;
}

const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, first_name: string, last_name: string}>>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_lead_id: '',
    department_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
    fetchDepartmentsAndEmployees();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hr_teams')
        .select(`
          *,
          team_lead:hr_employees!team_lead_id(first_name, last_name),
          department:hr_departments(name),
          team_members:hr_team_members(count)
        `);

      if (error) throw error;

      const formattedTeams = data?.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        team_lead_name: team.team_lead 
          ? `${team.team_lead.first_name} ${team.team_lead.last_name}`
          : 'No lead assigned',
        department_name: team.department?.name || 'No department',
        member_count: Array.isArray(team.team_members) ? team.team_members.length : 0
      })) || [];

      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsAndEmployees = async () => {
    try {
      const [deptResponse, empResponse] = await Promise.all([
        supabase.from('hr_departments').select('id, name'),
        supabase.from('hr_employees').select('id, first_name, last_name').eq('status', 'active')
      ]);

      if (deptResponse.data) setDepartments(deptResponse.data);
      if (empResponse.data) setEmployees(empResponse.data);
    } catch (error) {
      console.error('Error fetching departments and employees:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get current user's organization_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: userProfile } = await supabase
        .from('hr_employees')
        .select('organization_id')
        .eq('id', currentUser.user.id)
        .single();

      if (!userProfile) throw new Error('User profile not found');

      const { error } = await supabase
        .from('hr_teams')
        .insert([{
          ...formData,
          organization_id: userProfile.organization_id,
          team_lead_id: formData.team_lead_id || null,
          department_id: formData.department_id || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team created successfully",
      });

      setShowCreateModal(false);
      setFormData({ name: '', description: '', team_lead_id: '', department_id: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const { error } = await supabase
        .from('hr_teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team deleted successfully",
      });

      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Create and manage teams within your organization
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Team Lead</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.department_name}</Badge>
                    </TableCell>
                    <TableCell>{team.team_lead_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{team.member_count} members</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {team.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No teams found. Create your first team to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Set up a new team and assign members.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <Label htmlFor="team_name">Team Name *</Label>
              <Input
                id="team_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the team's purpose"
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, department_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team_lead">Team Lead</Label>
              <Select value={formData.team_lead_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, team_lead_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team lead" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
