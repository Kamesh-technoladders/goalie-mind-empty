
// Fix the update mutation to include all required fields
const updateStatusMutation = useMutation({
  mutationFn: async ({ projectId, newStatus }: { projectId: string; newStatus: string }) => {
    // First fetch the current project data
    const { data: currentProject, error: fetchError } = await supabase
      .from("hr_projects")
      .select("*")
      .eq("id", projectId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Now update with all fields preserved
    const { error } = await supabase
      .from("hr_projects")
      .update({
        ...currentProject, // Keep all existing data
        status: newStatus, // Only update the status
      })
      .eq("id", projectId);
      
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["projects", selectedClient?.id] });
    toast.success("Project status updated successfully!");
  },
  onError: () => {
    toast.error("Failed to update project status.");
  },
});
