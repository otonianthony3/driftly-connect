import { useEffect, useState } from "react";
import { supabase } from "@/types/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SecurityLog {
  id: string;
  user_id: string;
  event_name: string;
  event_type: string;
  ip_address: string;
  device_info: string;
  created_at: string;
  location?: string;
  status: "success" | "failure" | "warning";
}

interface SecurityActivityProps {
  userId: string;
}

const SecurityActivity: React.FC<SecurityActivityProps> = ({ userId }) => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7days");
  const [totalCount, setTotalCount] = useState(0);
  const logsPerPage = 10;

  const eventTypeColors = {
    success: "bg-green-100 text-green-800",
    failure: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
  };

  useEffect(() => {
    const fetchSecurityLogs = async () => {
      setLoading(true);
      
      // Calculate date range based on selected timeRange
      let fromDate;
      const now = new Date();
      
      switch (timeRange) {
        case "24hours":
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7days":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
        default:
          fromDate = null;
          break;
      }
      
      // Build query
      let query = supabase
        .from("security_logs")
        .select("*", { count: "exact" })
        .eq("user_id", userId);
      
      // Apply filter
      if (filter !== "all") {
        query = query.eq("event_type", filter);
      }
      
      // Apply date filter
      if (fromDate) {
        query = query.gte("created_at", fromDate.toISOString());
      }
      
      // Apply pagination
      const from = (page - 1) * logsPerPage;
      const to = from + logsPerPage - 1;
      
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) console.error("Error fetching logs:", error);
      else {
        setSecurityLogs(data || []);
        if (count !== null) {
          setTotalCount(count);
          setTotalPages(Math.ceil(count / logsPerPage));
        }
      }

      setLoading(false);
    };

    if (userId) fetchSecurityLogs();
  }, [userId, page, filter, timeRange]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
    setPage(1); // Reset to first page when time range changes
  };

  const getEventStatusBadge = (status: string) => {
    const colorClass = eventTypeColors[status as keyof typeof eventTypeColors] || "bg-gray-100 text-gray-800";
    return <Badge className={colorClass}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h2 className="text-xl font-semibold">Security Activity</h2>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="password_change">Password Change</SelectItem>
              <SelectItem value="mfa">MFA</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="profile_update">Profile Update</SelectItem>
              <SelectItem value="api_access">API Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && page > 1 ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : securityLogs.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Security Events</AlertTitle>
          <AlertDescription>
            No security events found for the selected filters.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * logsPerPage) + 1} to {Math.min(page * logsPerPage, totalCount)} of {totalCount} events
          </div>
          
          <div className="space-y-3">
            {securityLogs.map((log) => (
              <div key={log.id} className="border p-4 rounded-md shadow-sm hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{log.event_name}</span>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                  {getEventStatusBadge(log.status)}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                  <div>
                    <span className="text-gray-500">IP Address:</span> {log.ip_address}
                  </div>
                  <div>
                    <span className="text-gray-500">Device:</span> {log.device_info}
                  </div>
                  {log.location && (
                    <div>
                      <span className="text-gray-500">Location:</span> {log.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (page <= 3) {
                    pageNumber = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={page === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        Security events are retained for up to 90 days. For complete history, please download the logs.
      </div>
    </div>
  );
};

export default SecurityActivity;