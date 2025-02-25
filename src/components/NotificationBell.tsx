
import { useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from "lucide-react";

export interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
  user_id: string;
  action_url?: string;
  related_entity_id?: string;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  console.log("Fetching notifications...");
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.user) {
    console.log("No authenticated user found");
    return [];
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
  
  return notifications || [];
};

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    pushEnabled: false,
    paymentAlerts: true,
    systemUpdates: true
  });
  
  const [showSettings, setShowSettings] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60000, // Refresh every minute
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', session.session.user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error);
    }
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.session.user.id)
        .eq('read', false);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark notifications as read");
    }
  });

  // Update notification settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: typeof notificationSettings) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      // In a real app, this would update a notification_settings table
      console.log("Updating notification settings:", settings);
      
      // Simulate API call success
      return new Promise<{success: boolean}>((resolve) => {
        setTimeout(() => resolve({ success: true }), 500);
      });
    },
    onSuccess: () => {
      toast.success("Notification settings updated");
      setShowSettings(false);
    },
    onError: () => {
      toast.error("Failed to update settings");
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      markAsReadMutation.mutate(notification.id);
      
      // Navigate based on notification type
      if (notification.action_url) {
        navigate(notification.action_url);
      } else {
        switch (notification.type) {
          case 'payout_scheduled':
            navigate('/payouts/history');
            break;
          case 'contribution_due':
            navigate(`/thrift-system/${notification.related_entity_id}`);
            break;
          case 'financial_report':
            navigate(`/financial-reports/${notification.related_entity_id}`);
            break;
          default:
            // Just mark as read without navigation
            break;
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleSettingsChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const saveSettings = () => {
    updateSettingsMutation.mutate(notificationSettings);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payout_scheduled':
        return "💰";
      case 'contribution_due':
        return "📅";
      case 'new_member':
        return "👤";
      case 'system_update':
        return "🔄";
      case 'financial_report':
        return "📊";
      default:
        return "🔔";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex gap-2">
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h3 className="font-medium">Notification Settings</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email Notifications</span>
                        <Button 
                          variant={notificationSettings.emailEnabled ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleSettingsChange('emailEnabled')}
                        >
                          {notificationSettings.emailEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push Notifications</span>
                        <Button 
                          variant={notificationSettings.pushEnabled ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleSettingsChange('pushEnabled')}
                        >
                          {notificationSettings.pushEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment Alerts</span>
                        <Button 
                          variant={notificationSettings.paymentAlerts ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleSettingsChange('paymentAlerts')}
                        >
                          {notificationSettings.paymentAlerts ? "On" : "Off"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System Updates</span>
                        <Button 
                          variant={notificationSettings.systemUpdates ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleSettingsChange('systemUpdates')}
                        >
                          {notificationSettings.systemUpdates ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={saveSettings}
                        disabled={updateSettingsMutation.isPending}
                      >
                        {updateSettingsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Settings"
                        )}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markAllReadMutation.isPending}
              >
                {markAllReadMutation.isPending ? 
                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                  "Mark all read"
                }
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <>
              {notifications?.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={`flex gap-3 p-4 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="p-3 flex justify-center"
                onClick={() => navigate('/notifications')}
              >
                <span className="text-sm text-muted-foreground">View all notifications</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
