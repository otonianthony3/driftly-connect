import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalMembers: number;
  totalContributions: number;
  activeThriftSystems: number;
  monthlyData: {
    month: string;
    contributions: number;
    members: number;
  }[];
}

const ThriftAnalytics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['thrift-analytics'],
    queryFn: async () => {
      console.log("Fetching analytics data...");
      const { data: userData } = await supabase.auth.getUser();
      
      // Fetch total members
      const { data: membersData } = await supabase
        .from('memberships')
        .select('id')
        .eq('status', 'active');

      // Fetch total contributions
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('amount');

      // Fetch active thrift systems
      const { data: systemsData } = await supabase
        .from('thrift_systems')
        .select('id')
        .eq('status', 'active');

      // Generate monthly data (last 6 months)
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          contributions: Math.floor(Math.random() * 10000), // Replace with actual data
          members: Math.floor(Math.random() * 100) // Replace with actual data
        };
      }).reverse();

      return {
        totalMembers: membersData?.length || 0,
        totalContributions: contributionsData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
        activeThriftSystems: systemsData?.length || 0,
        monthlyData
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.totalContributions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeThriftSystems}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                contributions: {
                  theme: {
                    light: "#0ea5e9",
                    dark: "#0ea5e9",
                  },
                },
                members: {
                  theme: {
                    light: "#84cc16",
                    dark: "#84cc16",
                  },
                },
              }}
            >
              <BarChart data={analytics?.monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="contributions" name="Contributions" />
                <Bar dataKey="members" name="Members" />
                <ChartTooltip>
                  <ChartTooltipContent />
                </ChartTooltip>
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThriftAnalytics;