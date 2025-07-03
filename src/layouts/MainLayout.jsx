import React from "react";
import { Outlet } from "react-router-dom"; 
import { SidebarWrapper } from "../components/layout/SidebarWrapper";

const MainLayout = () => {
  return (
    <SidebarWrapper>
      <Outlet />
    </SidebarWrapper>
  );
};

export default MainLayout;
