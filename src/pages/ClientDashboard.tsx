import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ThriftSystem {
  id: string;
  name: string;
  contribution_amount: number;
  payout_schedule: string;
  max_members: number;
  memberships: {
    id: string;
  }[];
}

const fetchThriftSystems = async () => {
  console.log("Fetching thrift systems...");
  const { data, error } = await supabase
    .from('thrift_systems')
    .select(`
      *,
      memberships:memberships(id)
    `);

  if (error) throw error;
  return data as ThriftSystem[];
};

const ClientDashboard = () => {
  const { toast } = useToast();
  
  const { data: thriftSystems, isLoading } = useQuery({
    queryKey: ['thriftSystems'],
    queryFn: fetchThriftSystems,
  });

  const handleJoinSystem = async (systemId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from('memberships')
        .insert([
          {
            thrift_system_id: systemId,
            user_id: userData.user.id,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your request to join the thrift system has been sent to the admin.",
      });
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Thrift Systems</h1>
        <p className="text-muted-foreground mt-2">
          Browse and join available thrift systems
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {thriftSystems?.map((system) => (
          <Card key={system.id}>
            <CardHeader>
              <CardTitle>{system.name}</CardTitle>
              <CardDescription>
                {system.payout_schedule} contribution of ${system.contribution_amount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="font-medium">
                    {system.memberships.length}/{system.max_members}
                  </span>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleJoinSystem(system.id)}
                  disabled={system.memberships.length >= system.max_members}
                >
                  {system.memberships.length >= system.max_members ? "Full" : "Join System"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientDashboard;