import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import ContributionTracker from "@/components/ContributionTracker";
import MemberManagement from "@/components/MemberManagement";
import { useIsMobile } from "@/hooks/use-mobile";

const ThriftSystemDetails = () => {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  
  const { data: system, isLoading } = useQuery({
    queryKey: ['thriftSystem', id],
    queryFn: async () => {
      console.log("Fetching thrift system details for:", id);
      const { data, error } = await supabase
        .from('thrift_systems')
        .select(`
          *,
          memberships (
            id,
            status,
            join_date,
            profiles (
              id,
              full_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading || !system) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeMembers = system.memberships.filter(m => m.status === 'active');
  const pendingMembers = system.memberships.filter(m => m.status === 'pending');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{system.name}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          System Details and Progress
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-6 sm:mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {activeMembers.length}/{system.max_members}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {pendingMembers.length} pending requests
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold capitalize">
              {system.payout_schedule}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              ${system.contribution_amount} per cycle
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pool</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ${system.contribution_amount * activeMembers.length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Current cycle total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-6 ${isMobile ? '' : 'md:grid-cols-2'} mb-8`}>
        <ContributionTracker thriftSystemId={system.id} />
        <MemberManagement thriftSystemId={system.id} />
      </div>
    </div>
  );
};

export default ThriftSystemDetails;