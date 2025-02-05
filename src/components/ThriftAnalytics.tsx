import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, TrendingUp, Users, DollarSign } from "lucide-react";
import { useThriftAnalytics } from "@/hooks/use-thrift-analytics";

const ThriftAnalytics = () => {
  const { data: analytics, isLoading } = useThriftAnalytics();

  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-analytics'],
    queryFn: async () => {
      console.log("Fetching monthly analytics data...");
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          amount,
          status,
          created_at
        `)
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process monthly data
      const monthlyStats = data.reduce((acc, curr) => {
        const month = new Date(curr.created_at).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, contributions: 0, members: new Set() };
        }
        if (curr.status === 'completed') {
          acc[month].contributions += curr.amount;
        }
        return acc;
      }, {});

      return Object.values(monthlyStats);
    },
    staleTime: 1000 * 60 * 15, // Consider data fresh for 15 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalStats = analytics?.reduce((acc, curr) => ({
    totalMembers: (acc.totalMembers || 0) + curr.total_members,
    totalContributions: (acc.totalContributions || 0) + curr.total_contributions,
    activeThriftSystems: (acc.activeThriftSystems || 0) + 1
  }), {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats?.totalMembers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalStats?.totalContributions?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats?.activeThriftSystems || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contributions" fill="#0ea5e9" name="Contributions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThriftAnalytics;