
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCog, Shield, Building } from "lucide-react";
import UserManagementDashboard from './UserManagementDashboard';
import TeamManagement from './TeamManagement';
import UserManagementTree from './UserManagementTree';

const EnhancedUserManagement = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            User Management System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Teams
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Organization Tree
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <UserManagementDashboard />
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              <TeamManagement />
            </TabsContent>

            <TabsContent value="roles" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Role management functionality will be implemented in the next phase.
                    Currently, roles are managed through the organization tree view.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tree" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserManagementTree />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedUserManagement;
