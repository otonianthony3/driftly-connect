import { 
  Users as UserIcon, 
  DollarSign as DollarSignIcon, 
  LogOut as LogOutIcon, 
  UserCircle as UserCircleIcon, 
  Settings as SettingsIcon,
  Menu as MenuIcon,
  X as XIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AppNavigation() {
  const navigate = useNavigate();
  const [adminGroups, setAdminGroups] = useState([]); // Stores groups where user is admin
  const [open, setOpen] = useState(false);
  
  // Check if viewing on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // Handle responsive changes
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setOpen(false); // Close the menu after navigation
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleNavigation = (url) => {
    navigate(url);
    setOpen(false); // Close the menu after navigation
  };

  // Menu items
  const clientItems = [
    { title: "Client Dashboard", url: "/client/dashboard", icon: UserIcon },
    { title: "Admin Dashboard", url: "/admin/dashboard", icon: SettingsIcon },
    { title: "Payout History", url: "/payouts/history", icon: DollarSignIcon },
    { title: "Payout Management", url: "/admin/payouts", icon: DollarSignIcon },
    { title: "Profile", url: "/profile", icon: UserCircleIcon }
  ];
  
  const adminItems = adminGroups.map(groupId => ({
    title: `Manage Group ${groupId}`,
    url: `/admin/group/${groupId}`,
    icon: SettingsIcon
  }));

  // Sidebar content - extracted to avoid duplication
  const SidebarItems = () => (
    <div className="h-full flex flex-col py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Menu</h2>
        <div className="space-y-1">
          {clientItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation(item.url)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {adminItems.length > 0 && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Admin Groups</h2>
          <div className="space-y-1">
            {adminItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation(item.url)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-auto px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={handleLogoutIcon}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Mobile Navigation with Sheet */}
      {isMobile ? (
        <div className="fixed top-0 left-0 z-40 w-full bg-background border-b p-2">
          <div className="flex items-center justify-between">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="flex justify-end p-2">
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                <SidebarItems />
              </SheetContent>
            </Sheet>
            <div className="font-semibold">Your App</div>
            <div className="w-9"></div> {/* Empty div for balance */}
          </div>
        </div>
      ) : (
        /* Desktop Navigation with persistent sidebar */
        <>
          <div 
            className={`h-full border-r transition-all duration-300 ${
              open ? "w-64" : "w-20"
            } bg-background`}
          >
            <div className="flex h-16 items-center justify-between px-4">
              {open ? (
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">Your App</span>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="mx-auto">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* Desktop menu items */}
            {open ? (
              <SidebarItems />
            ) : (
              <div className="flex flex-col items-center py-4 space-y-4">
                {clientItems.map((item) => (
                  <Button
                    key={item.title}
                    variant="ghost"
                    size="icon"
                    title={item.title}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                ))}
                
                {adminItems.length > 0 && (
                  <>
                    <div className="h-px w-full bg-border" />
                    {adminItems.map((item) => (
                      <Button
                        key={item.title}
                        variant="ghost"
                        size="icon"
                        title={item.title}
                        onClick={() => handleNavigation(item.url)}
                      >
                        <item.icon className="h-5 w-5" />
                      </Button>
                    ))}
                  </>
                )}
                
                <div className="mt-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Logout"
                    className="text-destructive"
                    onClick={handleLogoutIcon}
                  >
                    <LogOutIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main content area */}
      <div className={`flex-1 ${isMobile ? "pt-16" : ""}`}>
        {/* Your application content will be rendered here */}
      </div>
    </div>
  );
}