import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { useThriftAnalytics } from "@/hooks/use-thrift-analytics";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsSummary {
  totalMembers: number;
  totalContributions: number;
  activeThriftSystems: number;
}

interface MonthlyData {
  month: string;
  contributions: number;
  members: Set<string>;
}

const ThriftAnalytics = () => {
  const { data: analytics, isLoading, error } = useThriftAnalytics();
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      setIsLoadingMonthly(true);
      setMonthlyError(null);
      try {
        const { data, error } = await supabase
          .from('contributions')
          .select('amount, created_at, membership_id')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString());

        if (error) {
          throw error;
        }

        // Process monthly data with error handling
        const monthlyStats = data.reduce((acc: Record<string, MonthlyData>, curr) => {
          try {
            const month = new Date(curr.created_at).toLocaleString('default', { month: 'short' });
            if (!acc[month]) {
              acc[month] = { month, contributions: 0, members: new Set() };
            }
            acc[month].contributions += curr.amount;
            acc[month].members.add(curr.membership_id);
            return acc;
          } catch (err) {
            console.error('Error processing contribution:', err);
            return acc;
          }
        }, {});

        const processedData = Object.values(monthlyStats).map(item => ({
          month: item.month,
          contributions: item.contributions,
          members: item.members.size
        }));

        setMonthlyData(processedData);
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
        setMonthlyError(err instanceof Error ? err.message : 'Failed to load monthly statistics');
        toast.error('Failed to load monthly statistics. Please try again later.');
      } finally {
        setIsLoadingMonthly(false);
      }
    };

    fetchMonthlyStats();
  }, []);

  if (isLoading || isLoadingMonthly) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || monthlyError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Failed to load analytics</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {error?.message || monthlyError || 'Please try again later'}
        </p>
      </div>
    );
  }

  if (!analytics?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-4 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No data available</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Start creating thrift systems and adding members to see analytics.
        </p>
      </div>
    );
  }

  const totalStats = analytics.reduce<AnalyticsSummary>((acc, curr) => ({
    totalMembers: (acc.totalMembers || 0) + curr.total_members,
    totalContributions: (acc.totalContributions || 0) + curr.total_contributions,
    activeThriftSystems: (acc.activeThriftSystems || 0) + 1
  }), {
    totalMembers: 0,
    totalContributions: 0,
    activeThriftSystems: 0
  });

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalStats.totalContributions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.activeThriftSystems}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis 
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar
                  dataKey="contributions"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThriftAnalytics;