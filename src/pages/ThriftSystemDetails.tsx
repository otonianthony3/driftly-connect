import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ThriftSystemDetails {
  id: string;
  name: string;
  contribution_amount: number;
  payout_schedule: string;
  max_members: number;
  description: string;
  memberships: {
    id: string;
    status: string;
    join_date: string;
    profiles: {
      id: string;
      full_name: string;
    };
    contributions: {
      id: string;
      amount: number;
      status: string;
      paid_date: string;
    }[];
  }[];
}

const fetchThriftSystemDetails = async (id: string): Promise<ThriftSystemDetails> => {
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
        ),
        contributions (
          id,
          amount,
          status,
          paid_date
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

const ThriftSystemDetails = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: system, isLoading } = useQuery({
    queryKey: ['thriftSystem', id],
    queryFn: () => fetchThriftSystemDetails(id!),
    enabled: !!id,
  });

  const handleMembershipAction = async (membershipId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ status: action === 'approve' ? 'active' : 'rejected' })
        .eq('id', membershipId);

      if (error) throw error;

      toast.success(`Member ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing member:`, error);
      toast.error(`Failed to ${action} member`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!system) return null;

  const activeMembers = system.memberships.filter(m => m.status === 'active');
  const pendingMembers = system.memberships.filter(m => m.status === 'pending');
  const totalContributions = system.memberships
    .flatMap(m => m.contributions)
    .reduce((sum, c) => sum + (c.status === 'completed' ? c.amount : 0), 0);
  const targetAmount = system.contribution_amount * system.max_members;
  const progressPercentage = (totalContributions / targetAmount) * 100;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{system.name}</h1>
        <p className="text-muted-foreground mt-2">
          System Details and Progress
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalContributions}</div>
            <Progress value={progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Target: ${targetAmount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeMembers.length}/{system.max_members}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {pendingMembers.length} pending requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {system.payout_schedule}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ${system.contribution_amount} per cycle
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {pendingMembers.map((member) => (
              <div key={member.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{member.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Pending Approval
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleMembershipAction(member.id, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleMembershipAction(member.id, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {activeMembers.map((member) => (
              <div key={member.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{member.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(member.join_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {member.contributions.filter(c => c.status === 'completed').length} contributions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: ${member.contributions
                      .filter(c => c.status === 'completed')
                      .reduce((sum, c) => sum + c.amount, 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThriftSystemDetails;