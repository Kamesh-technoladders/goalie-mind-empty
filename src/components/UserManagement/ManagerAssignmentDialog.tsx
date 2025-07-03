
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Building, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  department_name?: string;
  profile_picture_url?: string;
  reporting_manager_id?: string;
}

interface ManagerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess: () => void;
}

const ManagerAssignmentDialog: React.FC<ManagerAssignmentDialogProps> = ({
  open,
  onOpenChange,
  employee,
  onSuccess
}) => {
  const [managers, setManagers] = useState<Employee[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && employee) {
      fetchPotentialManagers();
      setSelectedManagerId(employee.reporting_manager_id || '');
    }
  }, [open, employee]);

  const fetchPotentialManagers = async () => {
    if (!employee) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hr_employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          position,
          profile_picture_url,
          department:hr_departments(name)
        `)
        .eq('status', 'active')
        .neq('id', employee.id)
        .order('first_name');

      if (error) throw error;

      const formattedManagers = (data || []).map(mgr => ({
        id: mgr.id,
        first_name: mgr.first_name,
        last_name: mgr.last_name,
        email: mgr.email,
        position: mgr.position,
        department_name: mgr.department?.name,
        profile_picture_url: mgr.profile_picture_url
      }));

      // Filter out employees who would create circular reporting (employee manages this potential manager)
      const validManagers = await filterCircularReporting(formattedManagers);
      setManagers(validManagers);
    } catch (error) {
      console.error('Error fetching potential managers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch potential managers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCircularReporting = async (potentialManagers: Employee[]) => {
    if (!employee) return potentialManagers;

    try {
      // For now, skip the circular reporting check since the function is not yet available
      // This can be re-enabled once the database functions are properly deployed
      return potentialManagers;
    } catch (error) {
      console.error('Error filtering circular reporting:', error);
      return potentialManagers;
    }
  };

  const handleSave = async () => {
    if (!employee) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('hr_employees')
        .update({ 
          reporting_manager_id: selectedManagerId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Reporting manager ${selectedManagerId ? 'assigned' : 'removed'} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating reporting manager:', error);
      toast({
        title: "Error",
        description: "Failed to update reporting manager",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Reporting Manager
          </DialogTitle>
          <DialogDescription>
            Set the reporting manager for {employee.first_name} {employee.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={employee.profile_picture_url} />
                <AvatarFallback>
                  {getInitials(employee.first_name, employee.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {employee.first_name} {employee.last_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {employee.position && (
                    <>
                      <span>{employee.position}</span>
                      {employee.department_name && <span>•</span>}
                    </>
                  )}
                  {employee.department_name && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span>{employee.department_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Manager Selection */}
          <div className="space-y-2">
            <Label htmlFor="manager-select">Reporting Manager</Label>
            {loading ? (
              <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
            ) : (
              <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reporting manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-gray-400" />
                      <span>No reporting manager</span>
                    </div>
                  </SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={manager.profile_picture_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(manager.first_name, manager.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {manager.first_name} {manager.last_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {manager.position && <span>{manager.position}</span>}
                            {manager.position && manager.department_name && <span>•</span>}
                            {manager.department_name && <span>{manager.department_name}</span>}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-gray-500">
              Employees without a reporting manager will appear in the "Direct Users" section
            </p>
          </div>

          {/* Current Manager Info */}
          {employee.reporting_manager_id && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">Current</Badge>
                <span className="text-gray-600">
                  Currently reports to: {managers.find(m => m.id === employee.reporting_manager_id)?.first_name} {managers.find(m => m.id === employee.reporting_manager_id)?.last_name}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || saving}
            className="min-w-24"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagerAssignmentDialog;
