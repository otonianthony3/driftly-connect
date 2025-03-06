import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThriftSystem } from "@/types/database";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppNavigation } from "@/components/AppNavigation";
import { useState, useEffect } from "react";
import ThriftSystemSearch from "@/components/ThriftSystemSearch";
import { useNavigate } from "react-router-dom";
import NotificationSettings from "@/components/NotificationSettings";

const ClientDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joiningSystemIds, setJoiningSystemIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const { data: thriftSystems, isLoading } = useQuery({
    queryKey: ['thriftSystems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thrift_systems')
        .select(`
          *,
          memberships (
            id,
            thrift_system_id,
            status,
            user_id,
            join_date,
            role
          )
        `);
      if (error) throw error;
      return data as ThriftSystem[];
    }
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (systemId: string) => {
      console.log("Attempting cancellation for system:", systemId);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("User fetch error:", userError);
        throw userError;
      }

      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('id')
        .eq('thrift_system_id', systemId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      console.log("Fetched membership:", membership, membershipError);

      if (membershipError || !membership) {
        console.warn("Membership not found, treating as successful cancellation.");
        return systemId;
      }

      const { error: deleteError } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membership.id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }

      console.log("Cancellation successful for system:", systemId);
      return systemId;
    },
    onMutate: (systemId: string) => {
      setCancellingIds(prev => [...prev, systemId]);
      // Snapshot the previous data
      const previousData = queryClient.getQueryData<ThriftSystem[]>(['thriftSystems']);
      // Optimistically update the cache: remove any pending membership for this system
      queryClient.setQueryData<ThriftSystem[]>(['thriftSystems'], oldData => {
        if (!oldData) return oldData;
        return oldData.map(system => {
          if (system.id === systemId) {
            return {
              ...system,
              memberships: system.memberships?.filter(m => !(m.user_id === currentUserId && m.status === 'pending')) || []
            };
          }
          return system;
        });
      });
      return { previousData };
    },
    onError: (error, systemId, context: any) => {
      console.error("Error cancelling request:", error);
      setCancellingIds(prev => prev.filter(id => id !== systemId));
      if (context?.previousData) {
        queryClient.setQueryData(['thriftSystems'], context.previousData);
      }
      toast({
        title: "Error",
        description: "Failed to cancel join request. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (systemId) => {
      queryClient.invalidateQueries({ queryKey: ['thriftSystems'] });
      setCancellingIds(prev => prev.filter(id => id !== systemId));
      toast({
        title: "Request Cancelled",
        description: "Your join request has been cancelled successfully.",
      });
    }
  });

  const handleJoinSystem = async (systemId: string) => {
    try {
      setJoiningSystemIds(prev => [...prev, systemId]);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const system = thriftSystems?.find(s => s.id === systemId);
      const activeMembers = system?.memberships?.filter(m => m.status === 'active').length || 0;

      if (activeMembers >= (system?.max_members || 0)) {
        toast({
          title: "System Full",
          description: "This thrift system has reached its maximum member capacity.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('memberships')
        .insert([
          {
            thrift_system_id: systemId,
            user_id: user.id,
            status: 'pending',
            role: 'member'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your request to join the thrift system has been sent to the admin.",
      });

      queryClient.invalidateQueries({ queryKey: ['thriftSystems'] });
    } catch (error) {
      console.error("Error joining system:", error);
      toast({
        title: "Error",
        description: "Failed to join the system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningSystemIds(prev => prev.filter(id => id !== systemId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppNavigation />
        <div className="flex-1 p-4 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Available Thrift Systems</h1>
            <p className="text-muted-foreground mt-2">
              Browse and join available thrift systems
            </p>
          </div>

          <div className="mb-8">
            <ThriftSystemSearch isClientView={true} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {thriftSystems?.map((system) => {
              const activeMembers = system.memberships?.filter(m => m.status === 'active').length || 0;
              const isActive = activeMembers === system.max_members;
              const isJoining = joiningSystemIds.includes(system.id);
              const isCancelling = cancellingIds.includes(system.id);
              const userHasPendingRequest = system.memberships?.some(m =>
                m.user_id === currentUserId &&
                m.status === 'pending'
              );

              return (
                <Card
                  key={system.id}
                  className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99] transition-transform"
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/thrift-system-view/${system.id}`);
                    }
                  }}
                  onClick={() => navigate(`/thrift-system-view/${system.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">{system.name}</CardTitle>
                      {isActive && (
                        <Badge variant="default" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {system.payout_schedule} contribution of ₦{system.contribution_amount}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Members</span>
                        <span className="font-medium">
                          {activeMembers}/{system.max_members}
                        </span>
                      </div>
                      {userHasPendingRequest ? (
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRequestMutation.mutate(system.id);
                          }}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            "Cancel Request"
                          )}
                        </Button>
                      ) : (
                        <Button
                          className="w-full touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinSystem(system.id);
                          }}
                          disabled={activeMembers >= system.max_members || isJoining}
                        >
                          {isJoining ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Joining...
                            </>
                          ) : activeMembers >= system.max_members ? (
                            "Full"
                          ) : (
                            "Join System"
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ClientDashboard;
