import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContributionTrackerProps {
  thriftSystemId: string;
}

const ContributionTracker = ({ thriftSystemId }: ContributionTrackerProps) => {
  const { data: contributions, isLoading } = useQuery({
    queryKey: ['contributions', thriftSystemId],
    queryFn: async () => {
      console.log("Fetching contributions for system:", thriftSystemId);
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          memberships (
            profiles (
              full_name
            )
          )
        `)
        .eq('memberships.thrift_system_id', thriftSystemId);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totalContributed = contributions?.reduce(
    (sum, contrib) => sum + (contrib.status === 'completed' ? contrib.amount : 0),
    0
  ) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Contribution Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Total Contributed</span>
              <span className="text-sm font-medium">${totalContributed}</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div className="space-y-2">
            {contributions?.map((contribution) => (
              <div key={contribution.id} className="flex justify-between items-center text-sm">
                <span>{contribution.memberships.profiles.full_name}</span>
                <div className="flex items-center gap-2">
                  <span>${contribution.amount}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    contribution.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contribution.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributionTracker;