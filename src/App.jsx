
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import SignUp from "./pages/GlobalSuperAdmin";
import PrivateRoutes from "./utils/PrivateRoutes";
import GlobalSuperadminDashboard from "./pages/Global_Dashboard";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/dashboard"
import Employee from "./pages/Employee";
import UserManagement from "./pages/UserManagement";
import Clients from "./pages/Client"
import ClientDashboard from "./components/Client/ClientDashboard";
import ProjectDashboard from "./components/Client/ProjectDashboard";
import Index from "./pages/Index";
import EmployeeProfile from "./pages/EmployeeProfile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect from root to dashboard for development */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoutes allowedRoles={["global_superadmin", "organization_superadmin", "admin", "employee"]} />}>
        <Route element={<MainLayout />}>
           <Route path="/dashboard" element={<Dashboard/>} />
           {/* <Route path="/employees" element={<Employee/>} /> */}
           <Route path="/clients" element={<Clients/>}/>
           <Route path="/client/:id" element={<ClientDashboard/>} />
           <Route path="/project/:id" element={<ProjectDashboard/>} />
           <Route path="/user-management" element={<UserManagement/>} />
          <Route path="/organization" element={<GlobalSuperadminDashboard />} />

          <Route path="/employee" element={<Index />} />
      <Route path="/employee/:id" element={<EmployeeProfile />} />

          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
