import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Spinner, IconButton } from "@chakra-ui/react";
import styled from "@emotion/styled";
import SidebarMenuItem from "./SidebarMenuItem";
import { getUserRole } from "../../utils/api";
import { ReactComponent as Logo } from "../../assets/logo.svg";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, role, loading } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (user?.id) {
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
    };

    fetchRole();
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const menuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Employees",
      path: "/employee",
      icon: "users",
    },
    {
      title: "Departments",
      path: "/user-management",
      icon: "square-check",
    },
    {
      title: "Jobs",
      path: "/jobs",
      icon: "square-check",
    },
    {
      title: "Goals",
      path: "/goals",
      icon: "square-check",
    },
    {
      title: "Reports",
      path: "/reports",
      icon: "square-check",
    },
  ];

  const adminMenuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Clients",
      path: "/clients",
      icon: "columns-2",
    },
    {
      title: "Client Dashboard",
      path: "/client-dashboard",
      icon: "columns-3",
    },
    {
      title: "Employees",
      path: "/employee",
      icon: "users",
    },
    {
      title: "Departments",
      path: "/user-management",
      icon: "square-check",
    },
    {
      title: "Jobs",
      path: "/jobs",
      icon: "square-check",
    },
    {
      title: "Goals",
      path: "/goals",
      icon: "square-check",
    },
    {
      title: "Reports",
      path: "/reports",
      icon: "square-check",
    },
  ];

  const employeeMenuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Goals",
      path: "/goalview",
      icon: "square-check",
    },
    {
      title: "Profile",
      path: "/profile",
      icon: "user",
    },
  ];

  const organizationMenuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: "layout-dashboard",
    },
    {
      title: "Clients",
      path: "/clients",
      icon: "columns-2",
    },
    {
      title: "Client Dashboard",
      path: "/client-dashboard",
      icon: "columns-3",
    },
    {
      title: "Employees",
      path: "/employee",
      icon: "users",
    },
    {
      title: "Departments",
      path: "/user-management",
      icon: "square-check",
    },
    {
      title: "Jobs",
      path: "/jobs",
      icon: "square-check",
    },
    {
      title: "Goals",
      path: "/goals",
      icon: "square-check",
    },
    {
      title: "Reports",
      path: "/reports",
      icon: "square-check",
    },
  ];

  let menu;
  if (role === "global_superadmin") {
    menu = adminMenuItems;
  } else if (role === "organization_superadmin") {
    menu = organizationMenuItems;
  } else if (role === "admin") {
    menu = adminMenuItems;
  } else if (role === "employee") {
    menu = employeeMenuItems;
  } else {
    menu = [];
  }

  if (loading) {
    return (
      <SidebarContainer isOpen={isSidebarOpen}>
        <Spinner />
      </SidebarContainer>
    );
  }

  return (
    <SidebarContainer isOpen={isSidebarOpen}>
      <LogoContainer>
        <Logo />
      </LogoContainer>
      <Menu>
        {menu?.map((item, index) => (
          <SidebarMenuItem
            key={index}
            title={item.title}
            path={item.path}
            icon={item.icon}
            active={location.pathname === item.path}
            onClick={() => handleMenuClick(item.path)}
          />
        ))}
      </Menu>
    </SidebarContainer>
  );
};

export default Sidebar;
const SidebarContainer = styled.div`
  width: 250px;
  height: 100vh;
  background-color: #f7f7f7;
  padding: 20px;
  position: fixed;
  top: 0;
  left: 0;
  transition: width 0.3s ease-in-out;
  overflow-x: hidden;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  @media (max-width: 768px) {
    width: ${(props) => (props.isOpen ? "250px" : "0")};
    padding: ${(props) => (props.isOpen ? "20px" : "0")};
  }
`;
const LogoContainer = styled.div`
  margin-bottom: 30px;
`;
const Menu = styled.ul`
  list-style: none;
  padding: 0;
`;
