import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/LoginPage";
import SignUp from "./pages/GlobalSuperAdmin";
import PrivateRoutes from "./utils/PrivateRoutes";
import GlobalSuperadminDashboard from "./pages/Global_Dashboard";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/dashboard";
import Employee from "./pages/Employee";
import UserManagement from "./pages/UserManagement";
import Clients from "./pages/Client";
import ClientDashboard from "./components/Client/ClientDashboard";
import ProjectDashboard from "./components/Client/ProjectDashboard";
import Index from "./pages/Index";
// import EmployeeProfile from "./pages/EmployeeProfile";
import ProfilePageEmployee from "./pages/ProfilePageEmployee";
import EmployeeList from "./pages/EmployeeList";
import EmployeeForm from "./pages/EmployeeForm";
import EmployeeProfile from "./pages/EmployeeProfile";
import GoalPage from "./pages/goals/Index";
import GoalView from "./pages/goals/EmployeeView";
import Jobs from "./pages/jobs/Jobs";
import JobView from "./pages/jobs/JobView";
import JobDescription from "./pages/jobs/JobDescription";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          element={
            <PrivateRoutes
              allowedRoles={[
                "global_superadmin",
                "organization_superadmin",
                "admin",
                "employee",
              ]}
            />
          }
        >
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/employees" element={<Employee/>} /> */}
            <Route path="/clients" element={<Clients />} />
            <Route path="/client/:id" element={<ClientDashboard />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route
              path="/organization"
              element={<GlobalSuperadminDashboard />}
            />

            <Route path="employee" element={<EmployeeList />} />
            <Route path="employee/new" element={<EmployeeForm />} />
            <Route path="employee/:id" element={<EmployeeForm />} />
            <Route path="employee/profile/:id" element={<EmployeeProfile />} />

            {/* Employee Dashboard Routes */}
            <Route path="/profile" element={<ProfilePageEmployee />} />

            {/* Goals */}
            <Route path="/goals" element={<GoalPage />} />
            <Route path="/goalsview" element={<GoalView />} />

            {/* Jobs */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobView />} />
            <Route path="/jobs/:id/description" element={<JobDescription />} />
            <Route path="/jobs/edit/:id" element={<JobDescription />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
