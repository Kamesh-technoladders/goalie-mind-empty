
import React from "react";
import { Routes, Route } from "react-router-dom";
import ClientManagementDashboard from "./ClientManagementDashboard";
import ClientCandidatesView from "./ClientCandidatesView";
import OfferedJoinedCandidatesList from "@/components/jobs/job/OfferedJoinedCandidatesList";

const ClientDashboardRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ClientManagementDashboard />} />
      <Route path="/:clientName/candidates" element={<ClientCandidatesView />} />
      <Route path="/offered-joined" element={<OfferedJoinedCandidatesList />} />
    </Routes>
  );
};

export default ClientDashboardRoutes;
