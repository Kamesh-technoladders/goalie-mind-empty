
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  fetchAllStatuses, 
  createStatus,
  updateStatus,
  deleteStatus,
  MainStatus,
  SubStatus
} from "@/services/statusService";
import { toast } from "sonner";
import { useSelector } from "react-redux";

// Create interface for component props
interface StatusSettingsProps {
  onStatusChange?: () => void;
}

const StatusSettings: React.FC<StatusSettingsProps> = ({ onStatusChange }) => {
  const [statuses, setStatuses] = useState<MainStatus[]>([]);
  const [activeTab, setActiveTab] = useState("main");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedMainStatus, setSelectedMainStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    description: "",
    displayOrder: 0
  });
  const organizationId = useSelector((state: any) => state.auth?.organization_id);

  // Fetch all statuses on component mount
  useEffect(() => {
    loadStatuses();
  }, []);

  // Load all statuses
  const loadStatuses = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllStatuses(organizationId);
      setStatuses(data);
    } catch (error) {
      console.error("Error loading statuses:", error);
      toast.error("Failed to load statuses");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new main status
  const handleCreateMainStatus = async () => {
    try {
      const newStatus: Partial<MainStatus> = {
        name: formData.name,
        color: formData.color,
        description: formData.description,
        type: 'main',
        display_order: formData.displayOrder
      };
      
      await createStatus(newStatus, organizationId);
      
      toast.success("Status created successfully");
      setIsModalOpen(false);
      resetForm();
      loadStatuses();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Error creating status:", error);
      toast.error("Failed to create status");
    }
  };

  // Create a new sub status
  const handleCreateSubStatus = async () => {
    try {
      if (!selectedMainStatus) {
        toast.error("Please select a parent status");
        return;
      }
      
      const newStatus: Partial<SubStatus> = {
        name: formData.name,
        color: formData.color,
        description: formData.description,
        type: 'sub',
        parent_id: selectedMainStatus,
        display_order: formData.displayOrder
      };
      
      await createStatus(newStatus, organizationId);
      
      toast.success("Sub-status created successfully");
      setIsSubModalOpen(false);
      resetForm();
      loadStatuses();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Error creating sub-status:", error);
      toast.error("Failed to create sub-status");
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3b82f6",
      description: "",
      displayOrder: 0
    });
    setSelectedMainStatus(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Status Management</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsModalOpen(true)}>Add Main Status</Button>
          <Button onClick={() => setIsSubModalOpen(true)}>Add Sub Status</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="main">Main Statuses</TabsTrigger>
          <TabsTrigger value="sub">Sub Statuses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Display Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : statuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">No statuses found</TableCell>
                </TableRow>
              ) : (
                statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: status.color }}
                        />
                        {status.color}
                      </div>
                    </TableCell>
                    <TableCell>{status.description || "N/A"}</TableCell>
                    <TableCell>{status.display_order || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="sub">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent Status</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Display Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : (
                statuses.flatMap(mainStatus => 
                  mainStatus.subStatuses ? mainStatus.subStatuses.map(subStatus => (
                    <TableRow key={subStatus.id}>
                      <TableCell className="font-medium">{subStatus.name}</TableCell>
                      <TableCell>{mainStatus.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: subStatus.color }}
                          />
                          {subStatus.color}
                        </div>
                      </TableCell>
                      <TableCell>{subStatus.description || "N/A"}</TableCell>
                      <TableCell>{subStatus.display_order || 0}</TableCell>
                    </TableRow>
                  )) : []
                )
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Main Status Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Main Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input 
                className="col-span-3" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Color</Label>
              <div className="col-span-3 flex gap-2">
                <Input 
                  type="color" 
                  className="w-12"
                  value={formData.color} 
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
                <Input 
                  className="flex-1" 
                  value={formData.color} 
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Description</Label>
              <Input 
                className="col-span-3" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Display Order</Label>
              <Input 
                type="number" 
                className="col-span-3" 
                value={formData.displayOrder} 
                onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMainStatus}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub Status Modal */}
      <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sub Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Parent Status</Label>
              <Select
                value={selectedMainStatus || ""}
                onValueChange={setSelectedMainStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a parent status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input 
                className="col-span-3" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Color</Label>
              <div className="col-span-3 flex gap-2">
                <Input 
                  type="color" 
                  className="w-12"
                  value={formData.color} 
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
                <Input 
                  className="flex-1" 
                  value={formData.color} 
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Description</Label>
              <Input 
                className="col-span-3" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Display Order</Label>
              <Input 
                type="number" 
                className="col-span-3" 
                value={formData.displayOrder} 
                onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubStatus}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusSettings;
