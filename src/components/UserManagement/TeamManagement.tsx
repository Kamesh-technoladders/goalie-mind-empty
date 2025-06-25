
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
  UserPlus,
  ChevronRight,
  ChevronDown,
  Settings,
  Shield,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import TeamDetailView from './TeamDetailView';
import TeamPermissionsDialog from './TeamPermissionsDialog';
import CreateTeamDialog from './CreateTeamDialog';

interface Team {
  id: string;
  name: string;
  description?: string;
  team_lead_name?: string;
  department_name?: string;
  member_count: number;
  parent_team_id?: string;
  team_type: 'department' | 'team' | 'sub_team';
  level: number;
  is_active: boolean;
  children?: Team[];
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
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
        `)
        .eq('is_active', true)
        .order('level')
        .order('name');

      if (error) throw error;

      const formattedTeams = data?.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        team_lead_name: team.team_lead 
          ? `${team.team_lead.first_name} ${team.team_lead.last_name}`
          : 'No lead assigned',
        department_name: team.department?.name || 'No department',
        member_count: Array.isArray(team.team_members) ? team.team_members.length : 0,
        parent_team_id: team.parent_team_id,
        team_type: team.team_type,
        level: team.level,
        is_active: team.is_active
      })) || [];

      // Build hierarchical structure
      const hierarchicalTeams = buildTeamHierarchy(formattedTeams);
      setTeams(hierarchicalTeams);
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

  const buildTeamHierarchy = (teams: Team[]): Team[] => {
    const teamMap = new Map<string, Team>();
    const rootTeams: Team[] = [];

    // Create map of all teams
    teams.forEach(team => {
      teamMap.set(team.id, { ...team, children: [] });
    });

    // Build hierarchy
    teams.forEach(team => {
      if (team.parent_team_id) {
        const parent = teamMap.get(team.parent_team_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(teamMap.get(team.id)!);
        }
      } else {
        rootTeams.push(teamMap.get(team.id)!);
      }
    });

    return rootTeams;
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

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const { error } = await supabase
        .from('hr_teams')
        .update({ is_active: false })
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

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const renderTeamRow = (team: Team, depth: number = 0) => {
    const hasChildren = team.children && team.children.length > 0;
    const isExpanded = expandedTeams.has(team.id);
    const paddingLeft = depth * 24;

    const filteredChildren = team.children?.filter(child =>
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const shouldShowTeam = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filteredChildren.length > 0;

    if (!shouldShowTeam) return null;

    return (
      <React.Fragment key={team.id}>
        <TableRow className="hover:bg-muted/50">
          <TableCell style={{ paddingLeft: `${16 + paddingLeft}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTeamExpansion(team.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <span className="font-medium">{team.name}</span>
              <Badge variant="outline" className="text-xs">
                {team.team_type}
              </Badge>
            </div>
          </TableCell>
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
                onClick={() => setSelectedTeam(team)}
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTeam(team);
                  setShowPermissionsModal(true);
                }}
                title="Manage permissions"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTeam(team.id)}
                title="Delete team"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && filteredChildren.map(child => 
          renderTeamRow(child, depth + 1)
        )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedTeam && !showPermissionsModal) {
    return (
      <TeamDetailView 
        team={selectedTeam} 
        onBack={() => setSelectedTeam(null)}
        onRefresh={fetchTeams}
      />
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
                Manage teams, permissions, and hierarchical structure
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </div>
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
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map(team => renderTeamRow(team))}
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

      <CreateTeamDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchTeams();
        }}
        departments={departments}
        employees={employees}
        teams={teams}
      />

      {selectedTeam && (
        <TeamPermissionsDialog
          open={showPermissionsModal}
          onOpenChange={setShowPermissionsModal}
          team={selectedTeam}
          onSuccess={() => {
            setShowPermissionsModal(false);
            fetchTeams();
          }}
        />
      )}
    </div>
  );
};

export default TeamManagement;
