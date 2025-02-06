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

const ClientDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const handleJoinSystem = async (systemId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
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
            user_id: userData.user.id,
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {thriftSystems?.map((system) => {
              const activeMembers = system.memberships?.filter(m => m.status === 'active').length || 0;
              const isActive = activeMembers === system.max_members;
              
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
                      {system.payout_schedule} contribution of ${system.contribution_amount}
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
                      <Button 
                        className="w-full touch-manipulation"
                        onClick={() => handleJoinSystem(system.id)}
                        disabled={activeMembers >= system.max_members}
                      >
                        {activeMembers >= system.max_members ? "Full" : "Join System"}
                      </Button>
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