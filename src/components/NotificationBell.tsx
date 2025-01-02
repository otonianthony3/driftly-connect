import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  console.log("Fetching notifications...");
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return notifications;
};

export function NotificationBell() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {isLoading ? (
          <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>
        ) : notifications?.length === 0 ? (
          <DropdownMenuItem disabled className="text-center text-muted-foreground">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications?.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className="flex flex-col items-start p-4 cursor-pointer"
              onClick={() => markAsRead(notification.id)}
            >
              <span className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
                {notification.message}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}