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
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
  
  return notifications || [];
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleNotificationClick = async (notification: Notification) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      if (notification.type === 'payout_scheduled') {
        navigate('/payouts/history');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
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
              onClick={() => handleNotificationClick(notification)}
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