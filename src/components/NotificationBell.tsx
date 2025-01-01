import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock data - replace with actual API call when backend is integrated
const fetchNotifications = async (): Promise<Notification[]> => {
  console.log("Fetching notifications...");
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    {
      id: "1",
      message: "New member request for Monthly Savings Group",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: "2",
      message: "Your request to join Weekly Contributors was approved",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ];
};

export function NotificationBell() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

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
        {notifications?.length === 0 ? (
          <DropdownMenuItem className="text-center text-muted-foreground">
            No new notifications
          </DropdownMenuItem>
        ) : (
          notifications?.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
              <span className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
                {notification.message}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}