
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Building,
  Edit,
  Save,
  X
} from "lucide-react";

interface UserDetailsModalProps {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    status: string;
    employment_start_date?: string;
    last_login?: string;
    role_name?: string;
    department_name?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const UserDetailsModal = ({ user, isOpen, onClose, onUpdate }: UserDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone || '',
    role_id: '',
    department_id: '',
    employment_start_date: user.employment_start_date || ''
  });
  const [roles, setRoles] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAdditionalData();
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        role_id: '',
        department_id: '',
        employment_start_date: user.employment_start_date || ''
      });
    }
  }, [isOpen, user]);

  const fetchAdditionalData = async () => {
    try {
      const [rolesResponse, departmentsResponse, activityResponse] = await Promise.all([
        supabase.from('hr_roles').select('id, name'),
        supabase.from('hr_departments').select('id, name'),
        supabase
          .from('hr_employee_work_times')
          .select('*')
          .eq('employee_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (rolesResponse.data) setRoles(rolesResponse.data);
      if (departmentsResponse.data) setDepartments(departmentsResponse.data);
      if (activityResponse.data) setUserActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching additional data:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('hr_employees')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.role_id || null,
          department_id: formData.department_id || null,
          employment_start_date: formData.employment_start_date || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User details updated successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {user.first_name} {user.last_name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                {getStatusBadge(user.status)}
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_first_name">First Name</Label>
                        <Input
                          id="edit_first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_last_name">Last Name</Label>
                        <Input
                          id="edit_last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_phone">Phone</Label>
                      <Input
                        id="edit_phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.employment_start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Started: {new Date(user.employment_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="edit_role">Role</Label>
                      <Select value={formData.role_id} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, role_id: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_department">Department</Label>
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
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>{user.role_name || 'No role assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.department_name || 'No department assigned'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>
                  Permissions are managed through role assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Current role: <strong>{user.role_name || 'No role assigned'}</strong>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  To modify permissions, update the user's role in the Details tab.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Work time and login history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.last_login && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Last Login</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.last_login).toLocaleString()}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recent Work Sessions</div>
                  {userActivity.length > 0 ? (
                    <div className="space-y-2">
                      {userActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                          <span>{new Date(activity.date).toLocaleDateString()}</span>
                          <span>{activity.duration_minutes ? `${Math.round(activity.duration_minutes / 60)}h ${activity.duration_minutes % 60}m` : 'In progress'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
