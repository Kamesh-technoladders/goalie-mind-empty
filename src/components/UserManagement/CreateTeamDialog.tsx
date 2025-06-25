
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getAuthDataFromLocalStorage } from "@/utils/localstorage";

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Team {
  id: string;
  name: string;
  team_type: string;
  level: number;
}

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  departments: Department[];
  employees: Employee[];
  teams: Team[];
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  departments,
  employees,
  teams
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_lead_id: '',
    department_id: '',
    parent_team_id: '',
    team_type: 'team' as 'department' | 'team' | 'sub_team'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const authData = getAuthDataFromLocalStorage();
      if (!authData) {
        throw new Error('Failed to retrieve authentication data');
      }
      const { organization_id, userId } = authData;

      // Calculate level based on parent team
      let level = 0;
      if (formData.parent_team_id) {
        const parentTeam = teams.find(t => t.id === formData.parent_team_id);
        level = parentTeam ? parentTeam.level + 1 : 0;
      }

      const teamData = {
        name: formData.name,
        description: formData.description,
        team_lead_id: formData.team_lead_id || null,
        department_id: formData.department_id || null,
        parent_team_id: formData.parent_team_id || null,
        team_type: formData.team_type,
        level: level,
        organization_id: organization_id,
        is_active: true
      };

      const { data: newTeam, error } = await supabase
        .from('hr_teams')
        .insert([teamData])
        .select()
        .single();

      if (error) throw error;

      // Log the audit trail
      await supabase
        .from('hr_team_audit_logs')
        .insert({
          team_id: newTeam.id,
          action_type: 'team_created',
          action_details: {
            team_data: teamData,
            created_by: userId,
            timestamp: new Date().toISOString()
          },
          performed_by: userId,
          organization_id: organization_id
        });

      toast({
        title: "Success",
        description: `${formData.team_type.charAt(0).toUpperCase() + formData.team_type.slice(1)} created successfully`,
      });

      setFormData({
        name: '',
        description: '',
        team_lead_id: '',
        department_id: '',
        parent_team_id: '',
        team_type: 'team'
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableParentTeams = () => {
    // Filter teams based on the selected team type
    if (formData.team_type === 'department') {
      return []; // Departments have no parent
    }
    if (formData.team_type === 'team') {
      return teams.filter(t => t.team_type === 'department');
    }
    if (formData.team_type === 'sub_team') {
      return teams.filter(t => t.team_type === 'team' || t.team_type === 'sub_team');
    }
    return teams;
  };

  const flattenTeams = (teamList: Team[]): Team[] => {
    const result: Team[] = [];
    
    const addTeamAndChildren = (team: Team) => {
      result.push(team);
      // Add any nested teams if they exist
      const children = teamList.filter(t => t.id === team.id);
      children.forEach(addTeamAndChildren);
    };

    teamList.forEach(addTeamAndChildren);
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team within your organization hierarchy.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="team_type">Team Type *</Label>
            <Select 
              value={formData.team_type} 
              onValueChange={(value: 'department' | 'team' | 'sub_team') => 
                setFormData(prev => ({ 
                  ...prev, 
                  team_type: value,
                  parent_team_id: '' // Reset parent when type changes
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="sub_team">Sub Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="team_name">Team Name *</Label>
            <Input
              id="team_name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter team name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the team's purpose"
              rows={3}
            />
          </div>

          {formData.team_type !== 'department' && (
            <div>
              <Label htmlFor="parent_team">Parent Team *</Label>
              <Select 
                value={formData.parent_team_id} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, parent_team_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent team" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableParentTeams().map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.team_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="department">Department</Label>
            <Select 
              value={formData.department_id} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, department_id: value }))
              }
            >
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
            <Select 
              value={formData.team_lead_id} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, team_lead_id: value }))
              }
            >
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;
