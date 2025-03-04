
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThriftSystem } from "@/types/database";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppNavigation } from "@/components/AppNavigation";
import { useState, useEffect } from "react";
import ThriftSystemSearch from "@/components/ThriftSystemSearch";

const ClientDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joiningSystemIds, setJoiningSystemIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const { data: thriftSystems, isLoading } = useQuery({
    queryKey: ['thriftSystems'],
    queryFn: async () => {
      console.log("Fetching thrift systems...");
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Find the membership ID for this user and system
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('id')
        .eq('thrift_system_id', systemId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (membershipError) throw membershipError;
      if (!membership) throw new Error('Membership request not found');

      // Delete the membership request
      const { error: deleteError } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membership.id);

      if (deleteError) throw deleteError;

      return systemId;
    },
    onMutate: (systemId) => {
      setCancellingIds(prev => [...prev, systemId]);
    },
    onSuccess: (systemId) => {
      queryClient.invalidateQueries({ queryKey: ['thriftSystems'] });
      setCancellingIds(prev => prev.filter(id => id !== systemId));
      toast({
        title: "Request Cancelled",
        description: "Your join request has been cancelled successfully.",
      });
    },
    onError: (error, systemId) => {
      console.error("Error cancelling request:", error);
      setCancellingIds(prev => prev.filter(id => id !== systemId));
      toast({
        title: "Error",
        description: "Failed to cancel join request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleJoinSystem = async (systemId: string) => {
    try {
      setJoiningSystemIds(prev => [...prev, systemId]);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Check if system has reached max members
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

  const handleCancelRequest = (systemId: string) => {
    cancelRequestMutation.mutate(systemId);
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

          {/* Add the ThriftSystemSearch component here */}
          <div className="mb-8">
            <ThriftSystemSearch />
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
                <Card key={system.id} className="flex flex-col">
                  <CardHeader>
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
                  <CardContent className="flex-1">
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
                          onClick={() => handleCancelRequest(system.id)}
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
                          onClick={() => handleJoinSystem(system.id)}
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
