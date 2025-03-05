import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import supabase from "../config/supabaseClient"; 

// Mock data for development - automatically logs the user in
const mockAuthData = {
  user: {
    id: "mock-user-id-123",
    email: "dev@example.com",
    user_metadata: {
      name: "Development User"
    }
  },
  role: "admin", // Use the role you need for testing: "global_superadmin", "organization_superadmin", "admin", or "employee"
  permissions: ["view_dashboard", "manage_employees", "manage_clients"],
  organization_id: "mock-org-id-123",
  loading: false,
  error: null,
};

// Use mock data for development or try to load from localStorage
const storedAuth = JSON.parse(localStorage.getItem("authState")) || mockAuthData;

// Save mock data to localStorage if it doesn't exist
if (!localStorage.getItem("authState")) {
  localStorage.setItem("authState", JSON.stringify(mockAuthData));
}

// ✅ Fetch user session, role, and permissions
export const fetchUserSession = createAsyncThunk(
  "auth/fetchUserSession",
  async (_, { rejectWithValue }) => {
    // For development mode, return mock data immediately
    if (process.env.NODE_ENV === "development") {
      console.log("✅ DEV MODE: Using mock authentication data");
      return mockAuthData;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) return rejectWithValue("No session found");

      const userId = session.session.user.id;

      // ✅ Fetch role from `hr_profiles`
      const { data: profile, error: profileError } = await supabase
        .from("hr_profiles")
        .select("role_id, organization_id") 
        .eq("id", userId)
        .single();

      if (profileError || !profile.organization_id) {
        return rejectWithValue("Organization ID is missing.");
      }

      // ✅ Fetch role name
      const { data: roleData, error: roleError } = await supabase
        .from("hr_roles")
        .select("name")
        .eq("id", profile.role_id)
        .single();
      if (roleError) return rejectWithValue(roleError.message);

      // ✅ Fetch role permissions
      const { data: permissions, error: permissionError } = await supabase
        .from("hr_role_permissions")
        .select("permission_id")
        .eq("role_id", profile.role_id);
      if (permissionError) return rejectWithValue(permissionError.message);

      // ✅ Fetch permission names
      const permissionIds = permissions.map((p) => p.permission_id);
      const { data: permissionNames, error: permNameError } = await supabase
        .from("hr_permissions")
        .select("name")
        .in("id", permissionIds);
      if (permNameError) return rejectWithValue(permNameError.message);

      const authData = {
        user: session.session.user,
        role: roleData.name,
        organization_id: profile.organization_id,
        permissions: permissionNames.map((p) => p.name),
      };

      // ✅ Save session in localStorage
      localStorage.setItem("authState", JSON.stringify(authData));

      return authData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: storedAuth, // ✅ Load from localStorage or use mock data
  reducers: {
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.permissions = [];
      state.organization_id = null;
      localStorage.removeItem("authState"); // ✅ Clear session on logout
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSession.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.loading = false;
      })
      .addCase(fetchUserSession.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
