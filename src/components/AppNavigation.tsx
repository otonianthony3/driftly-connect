import { Users as UserIcon, DollarSign as DollarSignIcon, Bell as BellIcon, LogOut as LogOutIcon, UserCircle as UserCircleIcon,Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AppNavigation() {
  const navigate = useNavigate();
  const [adminGroups, setAdminGroups] = useState([]); // Stores groups where user is admin

  useEffect(() => {
    const fetchUserGroups = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch groups where the user is an admin
      const { data, error } = await supabase
        .from("group_members") // Adjust to your actual table name
        .select("group_id")
        .eq("user_id", session.user.id)
        .eq("role", "admin"); // Fetch groups where user is an admin

      if (error) {
        console.error("Error fetching admin groups:", error);
      } else {
        setAdminGroups(data.map(g => g.group_id)); // Store admin group IDs
      }
    };

    fetchUserGroups();
  }, [navigate]);

  const handleLogoutIcon = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const clientItems = [
    { title: "Client Dashboard", url: "/client/dashboard", icon: UserIcon },
    { title: "Register", url: "/register", icon: UserIcon }, // Added Register Page
    { title: "Admin Dashboard", url: "/admin/dashboard", icon: SettingsIcon }, // Added Admin Dashboard
    { title: "Thrift System Details", url: "/thrift/details", icon: SettingsIcon }, // Added Thrift System Details
    { title: "Payout History", url: "/payouts/history", icon: DollarSignIcon },
    { title: "Payout Management", url: "/admin/payouts", icon: DollarSignIcon }, // Added Payout Management
    { title: "Notifications", url: "/notifications", icon: BellIcon },
    { title: "Profile", url: "/profile", icon: UserCircleIcon }
  ];
  
  const adminItems = adminGroups.map(groupId => ({
    title: `Manage Group ${groupId}`,
    url: `/admin/group/${groupId}`,
    icon: SettingsIcon
  }));

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Dynamically Show Admin Pages Based on Groups */}
              {adminItems.length > 0 && (
                <>
                  <SidebarGroupLabel>Admin Groups</SidebarGroupLabel>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => navigate(item.url)}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={handleLogoutIcon}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>LogOutIcon</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
          );
        }