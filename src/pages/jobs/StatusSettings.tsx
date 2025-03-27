
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit, Trash, Save, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import {
  fetchAllStatuses,
  createMainStatus,
  createSubStatus,
  updateStatus,
  deleteStatus,
  MainStatus,
  SubStatus
} from '@/services/statusService';

export default function StatusSettings() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<MainStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMain, setExpandedMain] = useState<string | null>(null);
  
  // Dialog states
  const [createMainDialogOpen, setCreateMainDialogOpen] = useState(false);
  const [createSubDialogOpen, setCreateSubDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [newMainStatus, setNewMainStatus] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [newSubStatus, setNewSubStatus] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    parentId: ''
  });
  const [editingStatus, setEditingStatus] = useState<{
    id: string;
    name: string;
    description: string;
    color: string;
    type: 'main' | 'sub';
  } | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<{
    id: string;
    name: string;
    type: 'main' | 'sub';
    hasSubStatuses: boolean;
  } | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  // Fetch statuses on component mount
  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const data = await fetchAllStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Error loading statuses:', error);
      toast.error('Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMainStatus = async () => {
    try {
      if (!newMainStatus.name.trim()) {
        toast.error('Status name is required');
        return;
      }
      
      const result = await createMainStatus({
        name: newMainStatus.name,
        description: newMainStatus.description || undefined,
        color: newMainStatus.color
      });
      
      if (result) {
        toast.success('Main status created successfully');
        setCreateMainDialogOpen(false);
        setNewMainStatus({ name: '', description: '', color: '#3B82F6' });
        await loadStatuses();
      }
    } catch (error) {
      console.error('Error creating main status:', error);
      toast.error('Failed to create main status');
    }
  };

  const handleCreateSubStatus = async () => {
    try {
      if (!newSubStatus.name.trim()) {
        toast.error('Status name is required');
        return;
      }
      
      if (!newSubStatus.parentId) {
        toast.error('Parent status is required');
        return;
      }
      
      const result = await createSubStatus({
        name: newSubStatus.name,
        description: newSubStatus.description || undefined,
        color: newSubStatus.color,
        parent_id: newSubStatus.parentId
      });
      
      if (result) {
        toast.success('Sub-status created successfully');
        setCreateSubDialogOpen(false);
        setNewSubStatus({ name: '', description: '', color: '#3B82F6', parentId: '' });
        await loadStatuses();
      }
    } catch (error) {
      console.error('Error creating sub-status:', error);
      toast.error('Failed to create sub-status');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      if (!editingStatus) return;
      
      if (!editingStatus.name.trim()) {
        toast.error('Status name is required');
        return;
      }
      
      const result = await updateStatus(editingStatus.id, {
        name: editingStatus.name,
        description: editingStatus.description || undefined,
        color: editingStatus.color
      });
      
      if (result) {
        toast.success('Status updated successfully');
        setEditDialogOpen(false);
        setEditingStatus(null);
        await loadStatuses();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteStatus = async () => {
    if (!deletingStatus) return;
    
    try {
      setIsDeleting(true);
      setDeleteProgress(25);
      
      const result = await deleteStatus(deletingStatus.id, forceDelete);
      
      setDeleteProgress(100);
      
      if (result) {
        toast.success('Status deleted successfully');
        setTimeout(() => {
          setDeleteDialogOpen(false);
          setDeletingStatus(null);
          setForceDelete(false);
          setIsDeleting(false);
          setDeleteProgress(0);
          loadStatuses();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error deleting status:', error);
      toast.error(error.message || 'Failed to delete status');
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  const openCreateSubDialog = (mainStatusId: string) => {
    setNewSubStatus({ ...newSubStatus, parentId: mainStatusId });
    setCreateSubDialogOpen(true);
  };

  const openEditDialog = (status: MainStatus | SubStatus) => {
    setEditingStatus({
      id: status.id,
      name: status.name,
      description: status.description || '',
      color: status.color || '#3B82F6',
      type: status.type
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (status: MainStatus | SubStatus) => {
    // Fix: Check if it's a MainStatus before accessing subStatuses
    const hasSubStatuses = status.type === 'main' && 
      (status as MainStatus).subStatuses !== undefined && 
      (status as MainStatus).subStatuses.length > 0;
    
    setDeletingStatus({
      id: status.id,
      name: status.name,
      type: status.type,
      hasSubStatuses
    });
    setDeleteDialogOpen(true);
  };

  const toggleExpand = (mainId: string) => {
    setExpandedMain(expandedMain === mainId ? null : mainId);
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Loading...</div>
          <div className="text-gray-500">Please wait while we fetch the status settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Status Management</h1>
          <Button 
            onClick={() => setCreateMainDialogOpen(true)}
            className="flex items-center mt-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Main Status
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            Manage all candidate statuses centrally from this page. These statuses will be available in the candidate table for all jobs.
          </p>
        </div>

        <div className="grid gap-4">
          {statuses.map((mainStatus) => (
            <Card key={mainStatus.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 py-3 px-4 cursor-pointer" onClick={() => toggleExpand(mainStatus.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: mainStatus.color || '#777777' }}
                    />
                    <CardTitle className="text-base font-medium">{mainStatus.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        openEditDialog(mainStatus); 
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        openDeleteDialog(mainStatus); 
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedMain === mainStatus.id && (
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Sub-Statuses</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openCreateSubDialog(mainStatus.id)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add Sub-Status
                      </Button>
                    </div>
                    
                    {mainStatus.subStatuses && mainStatus.subStatuses.length > 0 ? (
                      <div className="space-y-1">
                        {mainStatus.subStatuses.map((subStatus) => (
                          <div 
                            key={subStatus.id} 
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-sm" 
                                style={{ backgroundColor: subStatus.color || '#777777' }}
                              />
                              <span className="text-sm">{subStatus.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0"
                                onClick={() => openEditDialog(subStatus)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-500"
                                onClick={() => openDeleteDialog(subStatus)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No sub-statuses yet</div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
          
          {statuses.length === 0 && (
            <div className="bg-gray-50 p-4 text-center rounded-lg">
              <p className="text-gray-500">No statuses defined yet. Add a main status to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Main Status Dialog */}
      <Dialog open={createMainDialogOpen} onOpenChange={setCreateMainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Main Status</DialogTitle>
            <DialogDescription>
              Create a new main status for candidate tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Name*</label>
              <Input 
                value={newMainStatus.name} 
                onChange={(e) => setNewMainStatus({...newMainStatus, name: e.target.value})}
                placeholder="e.g., Interview"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={newMainStatus.description} 
                onChange={(e) => setNewMainStatus({...newMainStatus, description: e.target.value})}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-md border" 
                  style={{ backgroundColor: newMainStatus.color }}
                />
                <Input 
                  type="color" 
                  value={newMainStatus.color} 
                  onChange={(e) => setNewMainStatus({...newMainStatus, color: e.target.value})}
                  className="w-16"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMainDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMainStatus}>Create Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sub-Status Dialog */}
      <Dialog open={createSubDialogOpen} onOpenChange={setCreateSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sub-Status</DialogTitle>
            <DialogDescription>
              Create a new sub-status for more detailed tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Status</label>
              <Input 
                value={statuses.find(s => s.id === newSubStatus.parentId)?.name || ''}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Name*</label>
              <Input 
                value={newSubStatus.name} 
                onChange={(e) => setNewSubStatus({...newSubStatus, name: e.target.value})}
                placeholder="e.g., Technical Round"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={newSubStatus.description} 
                onChange={(e) => setNewSubStatus({...newSubStatus, description: e.target.value})}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-md border" 
                  style={{ backgroundColor: newSubStatus.color }}
                />
                <Input 
                  type="color" 
                  value={newSubStatus.color} 
                  onChange={(e) => setNewSubStatus({...newSubStatus, color: e.target.value})}
                  className="w-16"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSubDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubStatus}>Create Sub-Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingStatus?.type === 'main' ? 'Main' : 'Sub'} Status
            </DialogTitle>
            <DialogDescription>
              Update the status details
            </DialogDescription>
          </DialogHeader>
          {editingStatus && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Name*</label>
                <Input 
                  value={editingStatus.name} 
                  onChange={(e) => setEditingStatus({...editingStatus, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={editingStatus.description} 
                  onChange={(e) => setEditingStatus({...editingStatus, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-md border" 
                    style={{ backgroundColor: editingStatus.color }}
                  />
                  <Input 
                    type="color" 
                    value={editingStatus.color} 
                    onChange={(e) => setEditingStatus({...editingStatus, color: e.target.value})}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Status Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!isDeleting) {
          setDeleteDialogOpen(open);
          if (!open) {
            setForceDelete(false);
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this status?
            </DialogDescription>
          </DialogHeader>
          {deletingStatus && (
            <div className="py-2">
              <p className="mb-4">
                Are you sure you want to delete the {deletingStatus.type === 'main' ? 'main' : 'sub'} status "{deletingStatus.name}"?
              </p>
              
              {isDeleting && (
                <div className="mb-4">
                  <Progress value={deleteProgress} className="mb-2 h-2" />
                  <p className="text-sm text-gray-500">Deleting status...</p>
                </div>
              )}
              
              {deletingStatus.hasSubStatuses && !isDeleting && (
                <div className="mb-4 border border-amber-200 bg-amber-50 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-700 text-sm font-medium mb-1">
                        Warning: This status has sub-statuses
                      </p>
                      <p className="text-sm text-amber-600">
                        You can't delete a main status that has sub-statuses. Delete the sub-statuses first, or use force delete to remove all associated sub-statuses.
                      </p>
                      <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={forceDelete} 
                            onChange={(e) => setForceDelete(e.target.checked)}
                            className="rounded border-gray-300 text-primary"
                          />
                          <span className="text-sm font-medium text-amber-600">
                            Force delete (will delete all sub-statuses)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!deletingStatus.hasSubStatuses && deletingStatus.type === 'main' && (
                <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded mb-4">
                  This main status has no sub-statuses and can be safely deleted.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStatus}
              disabled={isDeleting || (deletingStatus?.hasSubStatuses && !forceDelete)}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
