
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Users,
  Settings,
  Shield,
  Plus,
  UserMinus,
  Activity
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
  parent_team_id?: string;
  team_type: 'department' | 'team' | 'sub_team';
  level: number;
  is_active: boolean;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  role_name?: string;
  is_lead: boolean;
}

interface TeamPermission {
  id: string;
  permission_key: string;
  permission_value: boolean;
  permission_name: string;
  permission_description: string;
  category: string;
}

interface SubTeam {
  id: string;
  name: string;
  team_type: string;
  member_count: number;
  team_lead_name?: string;
}

interface TeamDetailViewProps {
  team: Team;
  onBack: () => void;
  onRefresh: () => void;
}

const TeamDetailView: React.FC<TeamDetailViewProps> = ({ team, onBack, onRefresh }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamDetails();
  }, [team.id]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch direct team members
      const { data: membersData, error: membersError } = await supabase
        .from('hr_team_members')
        .select(`
          hr_employees!inner(
            id,
            first_name,
            last_name,
            email,
            position,
            hr_roles(name)
          )
        `)
        .eq('team_id', team.id);

      if (membersError) throw membersError;

      const formattedMembers = membersData?.map(member => ({
        id: member.hr_employees.id,
        first_name: member.hr_employees.first_name,
        last_name: member.hr_employees.last_name,
        email: member.hr_employees.email,
        position: member.hr_employees.position,
        role_name: member.hr_employees.hr_roles?.name,
        is_lead: false // We'll determine this from the team lead_id
      })) || [];

      setMembers(formattedMembers);

      // Fetch sub-teams
      const { data: subTeamsData, error: subTeamsError } = await supabase
        .from('hr_teams')
        .select(`
          id,
          name,
          team_type,
          team_lead:hr_employees!team_lead_id(first_name, last_name),
          team_members:hr_team_members(count)
        `)
        .eq('parent_team_id', team.id)
        .eq('is_active', true);

      if (subTeamsError) throw subTeamsError;

      const formattedSubTeams = subTeamsData?.map(subTeam => ({
        id: subTeam.id,
        name: subTeam.name,
        team_type: subTeam.team_type,
        member_count: Array.isArray(subTeam.team_members) ? subTeam.team_members.length : 0,
        team_lead_name: subTeam.team_lead 
          ? `${subTeam.team_lead.first_name} ${subTeam.team_lead.last_name}`
          : 'No lead assigned'
      })) || [];

      setSubTeams(formattedSubTeams);

      // Fetch team permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('hr_team_permissions')
        .select(`
          id,
          permission_key,
          permission_value,
          hr_default_permissions!inner(
            permission_name,
            permission_description,
            category
          )
        `)
        .eq('team_id', team.id);

      if (permissionsError) throw permissionsError;

      const formattedPermissions = permissionsData?.map(perm => ({
        id: perm.id,
        permission_key: perm.permission_key,
        permission_value: perm.permission_value,
        permission_name: perm.hr_default_permissions.permission_name,
        permission_description: perm.hr_default_permissions.permission_description,
        category: perm.hr_default_permissions.category
      })) || [];

      setPermissions(formattedPermissions);

    } catch (error) {
      console.error('Error fetching team details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsByCategory = () => {
    const categories = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, TeamPermission[]>);

    return categories;
  };

  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      analytics: 'Analytics & Reporting',
      task_management: 'Task Management',
      leave_management: 'Leave Management',
      member_management: 'Member Management',
      monitoring: 'Screen Monitoring',
      data_access: 'Data Visibility'
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const permissionsByCategory = getPermissionsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {team.name}
                <Badge variant="outline">{team.team_type}</Badge>
              </CardTitle>
              <CardDescription>
                {team.description || 'No description available'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Direct Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.position || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role_name || 'N/A'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No direct members assigned to this team.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sub Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Sub Teams ({subTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subTeams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subTeams.map(subTeam => (
                    <TableRow key={subTeam.id}>
                      <TableCell className="font-medium">{subTeam.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{subTeam.team_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subTeam.member_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{subTeam.team_lead_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sub-teams under this team.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Team Permissions
          </CardTitle>
          <CardDescription>
            Permissions granted to this team and its members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(permissionsByCategory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="font-medium mb-3">{getCategoryDisplayName(category)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map(permission => (
                      <div
                        key={permission.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          permission.permission_value 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{permission.permission_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {permission.permission_description}
                          </div>
                        </div>
                        <Badge 
                          variant={permission.permission_value ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {permission.permission_value ? "Granted" : "Denied"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No permissions configured for this team.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamDetailView;
