import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import CreateThriftSystem from "@/components/CreateThriftSystem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ThriftAnalytics from "@/components/ThriftAnalytics";
import ThriftSystemSearch from "@/components/ThriftSystemSearch";
import { ThriftSystem } from "@/types/database";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const AdminDashboard = () => {
  const [showCreateThrift, setShowCreateThrift] = useState(false);
  const [showMembersBreakdown, setShowMembersBreakdown] = useState(false);
  const [showSystemMembers, setShowSystemMembers] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [totalMembersData, setTotalMembersData] = useState({
    activeMembersCount: 0,
    pendingRequestsCount: 0,
    systems: []
  });
  const [supabaseError, setSupabaseError] = useState(null);
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error:", error.message, error);
        toast.error(`Authentication error: ${error.message}`);
        navigate("/login");
        return;
      }
      
      if (!user) {
        toast.error("Please login to access this page");
        navigate("/login");
        return;
      }
      setIsAuthChecking(false);
    } catch (error) {
      console.error("Auth check error:", error);
      toast.error(`Authentication error: ${error.message || "Unknown error"}`);
      navigate("/login");
    }
  };

  const { data: thriftSystems, isLoading, error } = useQuery({
    queryKey: ['adminThriftSystems'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("User fetch error:", userError.message, userError);
          setSupabaseError({
            type: "auth",
            message: userError.message,
            details: userError
          });
          throw userError;
        }
        
        if (!user) {
          const noUserError = new Error('Not authenticated');
          setSupabaseError({
            type: "auth",
            message: "Not authenticated",
            details: noUserError
          });
          throw noUserError;
        }

        console.log("Fetching thrift systems for admin:", user.id);
        
        const { data, error: supaError } = await supabase
          .from('thrift_systems')
          .select(`
            id,
            name,
            memberships!inner (
              id,
              status,
              user_id,
              disbursement_status
            )
          `)
          .eq('admin_id', user.id);

        if (supaError) {
          console.error("Supabase query error:", supaError.message, supaError);
          setSupabaseError({
            type: "query",
            message: supaError.message,
            code: supaError.code,
            details: supaError
          });
          throw supaError;
        }

        // Reset error state on successful fetch
        setSupabaseError(null);
        
        // Calculate total active members and pending requests across all systems
        let totalActive = 0;
        let totalPending = 0;
        
        const processedData = data.map(system => {
          const activeMembers = system.memberships.filter(m => m.status === 'active');
          const pendingMembers = system.memberships.filter(m => m.status === 'pending');
          
          totalActive += activeMembers.length;
          totalPending += pendingMembers.length;
          
          return {
            id: system.id,
            name: system.name,
            total_members: activeMembers.length,
            pending_requests: pendingMembers.length,
            members: system.memberships
          };
        });
        
        // Store the total members data for the breakdown dialog
        setTotalMembersData({
          activeMembersCount: totalActive,
          pendingRequestsCount: totalPending,
          systems: processedData
        });
        
        return processedData;
      } catch (err) {
        console.error("Error in queryFn:", err);
        // If we haven't already set a structured error, set a generic one
        if (!supabaseError) {
          setSupabaseError({
            type: "unknown",
            message: err.message || "Unknown error occurred",
            details: err
          });
        }
        throw err;
      }
    },
    retry: 1, // Allow one retry
    enabled: !isAuthChecking,
    meta: {
      errorMessage: "Failed to load thrift systems"
    }
  });

  // Query for fetching system members when a system is selected
  const { data: systemMembers, isLoading: isMembersLoading, error: membersError } = useQuery({
    queryKey: ['systemMembers', selectedSystemId],
    queryFn: async () => {
      if (!selectedSystemId) return null;
      
      try {
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            id,
            status,
            disbursement_status,
            disbursement_date,
            users (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('thrift_system_id', selectedSystemId)
          .eq('status', 'active');
        
        if (error) {
          console.error("Membership query error:", error.message, error);
          throw error;
        }
        
        return data.map(member => ({
          id: member.id,
          user_id: member.users.id,
          name: member.users.full_name,
          email: member.users.email,
          avatar_url: member.users.avatar_url,
          disbursement_status: member.disbursement_status,
          disbursement_date: member.disbursement_date
        }));
      } catch (err) {
        console.error("Error fetching system members:", err);
        throw err;
      }
    },
    enabled: !!selectedSystemId && showSystemMembers,
    retry: 1
  });

  const handleMemberCardClick = () => {
    setShowMembersBreakdown(true);
  };

  const handleSystemClick = (systemId) => {
    if (!showSystemMembers) {
      setSelectedSystemId(systemId);
      setShowSystemMembers(true);
    } else {
      navigate(`/thrift-system/${systemId}`);
    }
  };

  const getMemberCardShadow = (disbursementStatus) => {
    switch (disbursementStatus) {
      case 'received':
        return 'shadow-green-500 shadow-md';
      case 'pending':
        return 'shadow-blue-500 shadow-md';
      case 'upcoming':
        return 'shadow-yellow-500 shadow-md';
      default:
        return '';
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your thrift systems</p>
        </div>
        
        <div className="grid gap-6">
          <ThriftAnalytics />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation" 
              onClick={() => setShowCreateThrift(true)}
            >
              <CardContent className="flex items-center p-6">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-4" />
                <div>
                  <h3 className="font-semibold">Create Thrift System</h3>
                  <p className="text-sm text-muted-foreground">Set up a new thrift group</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Members Card - Now clickable */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
              onClick={handleMemberCardClick}
            >
              <CardContent className="flex items-center p-6">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-4 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Total Members</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalMembersData.activeMembersCount} active
                    {totalMembersData.pendingRequestsCount > 0 && (
                      <span className="text-red-500 ml-2">
                        ({totalMembersData.pendingRequestsCount} pending)
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-red-500 space-y-2">
                    <p><strong>Error loading thrift systems:</strong></p>
                    {supabaseError && (
                      <div className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                        <p><strong>Type:</strong> {supabaseError.type}</p>
                        <p><strong>Message:</strong> {supabaseError.message}</p>
                        {supabaseError.code && <p><strong>Code:</strong> {supabaseError.code}</p>}
                        <details className="mt-2">
                          <summary className="cursor-pointer">Show details</summary>
                          <pre className="mt-2 whitespace-pre-wrap text-xs">
                            {JSON.stringify(supabaseError.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              thriftSystems?.map((system) => (
                <Card 
                  key={system.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
                  onClick={() => handleSystemClick(system.id)}
                >
                  <CardContent className="flex items-center p-6">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-4" />
                    <div>
                      <h3 className="font-semibold line-clamp-1">{system.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {system.total_members} members
                        {system.pending_requests > 0 && (
                          <span className="text-red-500 ml-2">
                            ({system.pending_requests} pending)
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <ThriftSystemSearch />
        </div>

        {/* Dialogs */}
        {showCreateThrift && (
          <CreateThriftSystem 
            open={showCreateThrift} 
            onClose={() => setShowCreateThrift(false)} 
          />
        )}

        {/* Dialog for Members Breakdown */}
        <Dialog open={showMembersBreakdown} onOpenChange={setShowMembersBreakdown}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Members Breakdown</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Total Active Members: <span className="font-bold">{totalMembersData.activeMembersCount}</span> 
                {totalMembersData.pendingRequestsCount > 0 && (
                  <span className="ml-2">
                    (Pending: <span className="font-bold text-red-500">{totalMembersData.pendingRequestsCount}</span>)
                  </span>
                )}
              </p>
              
              <div className="divide-y">
                {totalMembersData.systems.map(system => (
                  <div key={system.id} 
                    className="py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      setSelectedSystemId(system.id);
                      setShowSystemMembers(true);
                      setShowMembersBreakdown(false);
                    }}
                  >
                    <h4 className="font-medium">{system.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {system.total_members} members
                      {system.pending_requests > 0 && (
                        <span className="text-red-500 ml-2">
                          ({system.pending_requests} pending)
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for System Members */}
        <Dialog open={showSystemMembers} onOpenChange={setShowSystemMembers}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {thriftSystems?.find(s => s.id === selectedSystemId)?.name} Members
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {isMembersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : membersError ? (
                <div className="text-center py-4 text-red-500">
                  <p>Error loading members: {membersError.message}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowSystemMembers(false)}
                  >
                    Close
                  </Button>
                </div>
              ) : systemMembers && systemMembers.length > 0 ? (
                <div className="space-y-3">
                  {systemMembers.map(member => (
                    <div 
                      key={member.id} 
                      className={`p-3 rounded-md flex items-center ${getMemberCardShadow(member.disbursement_status)}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt={member.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="ml-auto">
                        {member.disbursement_status === 'received' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Received
                          </span>
                        )}
                        {member.disbursement_status === 'pending' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                        {member.disbursement_status === 'upcoming' && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No active members found in this thrift system.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;