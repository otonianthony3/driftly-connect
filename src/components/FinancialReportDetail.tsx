
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Download, FileSpreadsheet, Loader2, ArrowDownToLine, Printer } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContributionWithSystem, PayoutWithSystem, ContributionWithMember, PayoutWithMember } from "@/types/database";

interface FinancialReportDetailProps {
  thriftSystemId?: string;
  period?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const FinancialReportDetail = ({ thriftSystemId, period = "monthly" }: FinancialReportDetailProps) => {
  const [reportPeriod, setReportPeriod] = useState<string>(period);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);
  const isMobile = useIsMobile();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-report', thriftSystemId, reportPeriod, selectedYear],
    queryFn: async () => {
      if (!thriftSystemId) {
        // Fetch user's overall financial data
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user.id;
        
        if (!userId) throw new Error("User not authenticated");

        // Get user's contributions and payouts for the selected period
        const { data: contributionsData, error: contribError } = await supabase
          .from('contributions')
          .select(`
            amount, 
            status, 
            created_at,
            memberships (
              thrift_system_id,
              thrift_systems (
                name
              )
            )
          `)
          .eq('memberships.user_id', userId)
          .gte('created_at', getPeriodStartDate(reportPeriod, selectedYear))
          .order('created_at', { ascending: false });

        if (contribError) throw contribError;

        // Transform data to have the format we need
        const contributions = (contributionsData || []).map(contrib => ({
          amount: contrib.amount,
          status: contrib.status,
          created_at: contrib.created_at,
          thrift_systems: {
            name: contrib.memberships?.thrift_systems?.name || "Unknown"
          }
        })) as ContributionWithSystem[];

        const { data: payoutsData, error: payoutError } = await supabase
          .from('payouts')
          .select(`
            amount, 
            status, 
            scheduled_date, 
            completed_date,
            thrift_system_id,
            thrift_systems (
              name
            )
          `)
          .eq('member_id', userId)
          .gte('scheduled_date', getPeriodStartDate(reportPeriod, selectedYear))
          .order('scheduled_date', { ascending: false });

        if (payoutError) throw payoutError;

        const payouts = (payoutsData || []).map(payout => ({
          amount: payout.amount,
          status: payout.status,
          scheduled_date: payout.scheduled_date,
          completed_date: payout.completed_date,
          thrift_systems: {
            name: payout.thrift_systems?.name || "Unknown"
          }
        })) as PayoutWithSystem[];

        // Process data for charts
        const monthlyContributions = processMonthlyData(contributions, 'amount', 'created_at');
        const monthlyPayouts = processMonthlyData(payouts, 'amount', 'scheduled_date');
        
        const thriftSystemDistribution = contributions.reduce((acc: Record<string, number>, curr) => {
          const systemName = curr.thrift_systems.name;
          if (!acc[systemName]) acc[systemName] = 0;
          acc[systemName] += curr.amount;
          return acc;
        }, {});

        const pieChartData = Object.entries(thriftSystemDistribution).map(([name, value]) => ({
          name,
          value
        }));

        return {
          contributions,
          payouts,
          monthlyContributions,
          monthlyPayouts,
          pieChartData,
          totalContributed: contributions.reduce((sum, item) => sum + item.amount, 0),
          totalReceived: payouts.filter(p => p.status === 'completed').reduce((sum, item) => sum + item.amount, 0),
          pendingPayouts: payouts.filter(p => p.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
        };
      } else {
        // Fetch specific thrift system financial data
        const { data: thriftSystem, error: thriftError } = await supabase
          .from('thrift_systems')
          .select(`
            name,
            contribution_amount,
            payout_schedule,
            created_at
          `)
          .eq('id', thriftSystemId)
          .single();

        if (thriftError) throw thriftError;

        // Get all contributions for this thrift system
        const { data: contributionsData, error: contribError } = await supabase
          .from('contributions')
          .select(`
            amount, 
            status, 
            created_at,
            memberships (
              user_id,
              profiles (
                full_name
              )
            )
          `)
          .eq('memberships.thrift_system_id', thriftSystemId)
          .gte('created_at', getPeriodStartDate(reportPeriod, selectedYear))
          .order('created_at', { ascending: false });

        if (contribError) throw contribError;

        const contributions = (contributionsData || []).map(contrib => ({
          amount: contrib.amount,
          status: contrib.status,
          created_at: contrib.created_at,
          memberships: {
            profiles: contrib.memberships?.profiles || null
          }
        })) as ContributionWithMember[];

        // Get all payouts for this thrift system
        const { data: payoutsData, error: payoutError } = await supabase
          .from('payouts')
          .select(`
            amount, 
            status, 
            scheduled_date, 
            completed_date,
            member_id,
            profiles:member_id(
              full_name
            )
          `)
          .eq('thrift_system_id', thriftSystemId)
          .gte('scheduled_date', getPeriodStartDate(reportPeriod, selectedYear))
          .order('scheduled_date', { ascending: false });

        if (payoutError) throw payoutError;

        // Transform data to match PayoutWithMember type
        const payouts = (payoutsData || []).map(payout => {
          return {
            amount: payout.amount,
            status: payout.status,
            scheduled_date: payout.scheduled_date,
            completed_date: payout.completed_date,
            member_id: payout.member_id,
            profiles: typeof payout.profiles === 'object' ? payout.profiles : null
          };
        }) as PayoutWithMember[];

        // Process data for charts
        const monthlyContributions = processMonthlyData(contributions, 'amount', 'created_at');
        const monthlyPayouts = processMonthlyData(payouts, 'amount', 'scheduled_date');
        
        const memberDistribution = contributions.reduce((acc: Record<string, number>, curr) => {
          const memberName = curr.memberships?.profiles?.full_name || 'Unknown';
          if (!acc[memberName]) acc[memberName] = 0;
          acc[memberName] += curr.amount;
          return acc;
        }, {});

        const pieChartData = Object.entries(memberDistribution).map(([name, value]) => ({
          name,
          value
        }));

        return {
          thriftSystem,
          contributions,
          payouts,
          monthlyContributions,
          monthlyPayouts,
          pieChartData,
          totalContributed: contributions.reduce((sum, item) => sum + item.amount, 0),
          totalPaidOut: payouts.filter(p => p.status === 'completed').reduce((sum, item) => sum + item.amount, 0),
          pendingPayouts: payouts.filter(p => p.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
        };
      }
    }
  });

  const getPeriodStartDate = (period: string, year: string): string => {
    const currentDate = new Date();
    switch (period) {
      case 'monthly':
        return `${year}-01-01`;
      case 'quarterly':
        return `${parseInt(year) - 1}-10-01`;
      case 'annually':
        return `${parseInt(year) - 4}-01-01`;
      default:
        return `${year}-01-01`;
    }
  };

  const processMonthlyData = (data: any[], valueKey: string, dateKey: string) => {
    const months: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateKey]);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!months[monthName]) {
        months[monthName] = 0;
      }
      
      months[monthName] += item[valueKey];
    });
    
    // Convert to array format for charts
    return Object.entries(months).map(([month, value]) => ({
      month,
      value
    }));
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      // Simulating export functionality
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Report successfully exported as ${format.toUpperCase()}`);
      
      // In a real implementation, you would call a backend service to generate
      // the report and then trigger a download
    } catch (error) {
      toast.error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <Label htmlFor="report-period">Report Period</Label>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger id="report-period" className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="report-year">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="report-year" className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('pdf')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData?.totalContributed.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData?.totalPaidOut?.toLocaleString() || reportData?.totalReceived?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData?.pendingPayouts.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 print:hidden">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          {thriftSystemId && <TabsTrigger value="members">Members</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
                <CardDescription>Contributions and payouts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        ...(reportData?.monthlyContributions || []).map(item => ({
                          month: item.month,
                          contributions: item.value,
                          payouts: 0
                        })),
                        ...(reportData?.monthlyPayouts || []).map(item => ({
                          month: item.month,
                          contributions: 0,
                          payouts: item.value
                        }))
                      ].reduce((acc, item) => {
                        const existing = acc.find(i => i.month === item.month);
                        if (existing) {
                          existing.contributions += item.contributions;
                          existing.payouts += item.payouts;
                        } else {
                          acc.push(item);
                        }
                        return acc;
                      }, [] as any[])}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="contributions" 
                        stroke="#8884d8" 
                        name="Contributions"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="payouts" 
                        stroke="#82ca9d" 
                        name="Payouts"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {thriftSystemId ? "Member Contributions" : "Thrift System Distribution"}
                </CardTitle>
                <CardDescription>
                  {thriftSystemId 
                    ? "Contribution breakdown by member" 
                    : "How your contributions are distributed"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData?.pieChartData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={!isMobile}
                        label={!isMobile ? (entry) => entry.name : undefined}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData?.pieChartData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contributions">
          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
              <CardDescription>All contributions for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{thriftSystemId ? "Member" : "Thrift System"}</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData?.contributions || []).length > 0 ? (
                    (reportData?.contributions || []).map((contribution, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {thriftSystemId 
                            ? contribution.memberships?.profiles?.full_name || "Unknown"
                            : (contribution as any).thrift_systems?.name || "Unknown"
                          }
                        </TableCell>
                        <TableCell>${contribution.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(contribution.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contribution.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {contribution.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No contributions found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>All payouts for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{thriftSystemId ? "Member" : "Thrift System"}</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData?.payouts || []).length > 0 ? (
                    (reportData?.payouts || []).map((payout, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {thriftSystemId 
                            ? payout.profiles?.full_name || "Unknown"
                            : (payout as any).thrift_systems?.name || "Unknown"
                          }
                        </TableCell>
                        <TableCell>${payout.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(payout.scheduled_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {payout.completed_date 
                            ? new Date(payout.completed_date).toLocaleDateString() 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payout.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payout.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No payouts found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {thriftSystemId && (
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Member Performance</CardTitle>
                <CardDescription>Contribution status of all members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] mb-6">
                  <ResponsiveContainer width="100%" height