import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Users, Building, Settings, User, LayoutDashboard, Briefcase, Goal, FileText, LogOut } from "lucide-react";
import { logout } from "../../Redux/authSlice";
import { useNavigate } from "react-router-dom";

interface MenuSubItem {
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
}

interface MenuItem {
  label: string;
  path?: string;
  icon: React.ComponentType<any>;
  subItems?: MenuSubItem[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuConfig: Record<string, MenuGroup[]> = {
  global_superadmin: [
    {
      label: "Core",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Organization", path: "/organization", icon: Building },
        { label: "Settings", path: "/settings", icon: Settings },
      ]
    }
  ],
  organization_superadmin: [
    {
      label: "Real Time",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { 
          label: "User Management", 
          icon: Users,
          subItems: [
            { label: "Employees", path: "/employee" },
            { label: "User Management", path: "/user-management" }
          ]
        }
      ]
    },
    {
      label: "Operations",
      items: [
        { label: "Clients", path: "/clients", icon: Building },
        { label: "Jobs", path: "/jobs", icon: Briefcase },
        { label: "Goals", path: "/goals", icon: Goal },
        { label: "Reports", path: "/reports", icon: FileText },
      ]
    }
  ],
  admin: [
    {
      label: "Real Time",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Employees", path: "/employee", icon: Users },
      ]
    },
    {
      label: "Operations",
      items: [
        { label: "Clients", path: "/clients", icon: Building },
        { label: "Jobs", path: "/jobs", icon: Briefcase },
        { label: "Goals", path: "/goals", icon: Goal },
      ]
    }
  ],
  employee: [
    {
      label: "My Work",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Jobs", path: "/jobs", icon: Briefcase },
        { label: "My Profile", path: "/profile", icon: User },
        { label: "Goals", path: "/goalview", icon: Goal },
      ]
    }
  ]
};

export function ModernSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useSidebar();
  const { role } = useSelector((state: any) => state.auth);
  const user = useSelector((state: any) => state.auth.user);

  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const currentGroups = menuConfig[role] || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => 
      item.path && isPathActive(item.path) ||
      item.subItems?.some(subItem => isPathActive(subItem.path))
    );
  };

  const isSubMenuActive = (subItems: MenuSubItem[]) => {
    return subItems.some(subItem => isPathActive(subItem.path));
  };

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">HR</span>
          </div>
          {state === "expanded" && (
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">HR System</h2>
              <p className="text-xs text-sidebar-foreground/70">Management Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        {currentGroups.map((group) => {
          const isActive = isGroupActive(group);
          const isOpen = openGroups.includes(group.label) || isActive;

          return (
            <SidebarGroup key={group.label}>
              <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.label)}>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="group/label flex items-center justify-between hover:bg-sidebar-accent rounded-md cursor-pointer">
                    <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                      {group.label}
                    </span>
                    {state === "expanded" && (
                      <ChevronRight 
                        className={cn(
                          "h-3 w-3 transition-transform text-sidebar-foreground/50",
                          isOpen && "rotate-90"
                        )} 
                      />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isItemActive = item.path ? isPathActive(item.path) : false;
                        const isSubActive = hasSubItems && isSubMenuActive(item.subItems!);
                        const showAsActive = isItemActive || isSubActive;

                        if (hasSubItems) {
                          return (
                            <SidebarMenuItem key={item.label}>
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton 
                                    className={cn(
                                      "w-full justify-between",
                                      showAsActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <item.icon className="h-4 w-4" />
                                      {state === "expanded" && <span>{item.label}</span>}
                                    </div>
                                    {state === "expanded" && (
                                      <ChevronRight className="h-3 w-3 transition-transform" />
                                    )}
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {item.subItems!.map((subItem) => (
                                      <SidebarMenuSubItem key={subItem.path}>
                                        <SidebarMenuSubButton asChild>
                                          <Link 
                                            to={subItem.path}
                                            className={cn(
                                              "flex items-center gap-2",
                                              isPathActive(subItem.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                            )}
                                          >
                                            {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                            <span>{subItem.label}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </Collapsible>
                            </SidebarMenuItem>
                          );
                        }

                        return (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton asChild>
                              <Link 
                                to={item.path!}
                                className={cn(
                                  "flex items-center gap-2",
                                  isItemActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                )}
                              >
                                <item.icon className="h-4 w-4" />
                                {state === "expanded" && <span>{item.label}</span>}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
              <User className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            {state === "expanded" && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.user_metadata?.first_name || "User"} {user?.user_metadata?.last_name || ""}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            {state === "expanded" && <span>Logout</span>}
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}