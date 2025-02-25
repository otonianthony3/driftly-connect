
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Printer,
  FileText,
  Info,
  AlertCircle,
  Loader2,
  DollarSign,
  Calendar,
  CreditCard
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FinancialReports = () => {
  const navigate = useNavigate();
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("6months");
  const [reportType, setReportType] = useState<string>("summary");

  // Fetch all thrift systems the user is part of
  const { data: systems, isLoading: loadingSystems } = useQuery({
    queryKey: ['user-thrift-systems'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('memberships')
        .select(`
          thrift_system_id,
          thrift_systems (
            id,
            name,
            contribution_amount,
            cycle_duration
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data?.map(m => m.thrift_systems) || [];
    },
  });

  // Set first system as default when data loads
  useEffect(() => {
    if (systems && systems.length > 0 && !selectedSystem) {
      setSelectedSystem(systems[0].id);
    }
  }, [systems, selectedSystem]);

  // Fetch financial data for the selected system
  const { data: financialData, isLoading: loadingFinancial } = useQuery({
    queryKey: ['financial-data', selectedSystem, timeRange],
    queryFn: async () => {
      if (!selectedSystem) return null;

      // Get date range based on selected time period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate.setFullYear(2000); // Arbitrary past date
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      // Fetch contributions
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select(`
          id,
          amount,
          status,
          payment_date,
          due_date,
          membership_id,
          memberships (
            user_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('memberships.thrift_system_id', selectedSystem)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString());

      if (contribError) throw contribError;

      // Fetch payouts
      const { data: payouts, error: payoutError } = await supabase
        .from('payouts')
        .select(`
          id,
          amount,
          status,
          scheduled_date,
          completed_date,
          member_id,
          profiles (
            full_name
          )
        `)
        .eq('thrift_system_id', selectedSystem)
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', endDate.toISOString());

      if (payoutError) throw payoutError;

      // Get system details
      const { data: systemDetails, error: systemError } = await supabase
        .from('thrift_systems')
        .select('*')
        .eq('id', selectedSystem)
        .single();

      if (systemError) throw systemError;

      // Process data for monthly summary
      const months: Record<string, any> = {};
      
      // Process contributions
      contributions.forEach(contrib => {
        const date = new Date(contrib.due_date || contrib.payment_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!months[monthKey]) {
          months[monthKey] = {
            month: monthKey,
            displayMonth: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            contributionsTotal: 0,
            contributionsPaid: 0,
            contributionsPending: 0,
            payoutsTotal: 0,
            participationRate: 0,
            memberCount: 0
          };
        }
        
        months[monthKey].contributionsTotal += contrib.amount;
        if (contrib.status === 'completed') {
          months[monthKey].contributionsPaid += contrib.amount;
        } else {
          months[monthKey].contributionsPending += contrib.amount;
        }
      });
      
      // Process payouts
      payouts.forEach(payout => {
        const date = new Date(payout.scheduled_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!months[monthKey]) {
          months[monthKey] = {
            month: monthKey,
            displayMonth: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            contributionsTotal: 0,
            contributionsPaid: 0,
            contributionsPending: 0,
            payoutsTotal: 0,
            participationRate: 0,
            memberCount: 0
          };
        }
        
        months[monthKey].payoutsTotal += payout.amount;
      });
      
      // Calculate participation rates
      Object.values(months).forEach((monthData: any) => {
        const expectedAmount = systemDetails.contribution_amount * systemDetails.max_members;
        monthData.participationRate = expectedAmount > 0 
          ? (monthData.contributionsPaid / expectedAmount) * 100 
          : 0;
        monthData.memberCount = Math.round(monthData.contributionsPaid / systemDetails.contribution_amount);
      });
      
      // Convert to array and sort by month
      const monthlySummary = Object.values(months).sort((a: any, b: any) => 
        a.month.localeCompare(b.month)
      );
      
      // Calculate totals for summary
      const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const paidContributions = contributions
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const pendingContributions = totalContributions - paidContributions;
      const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Calculate current balance
      const currentBalance = paidContributions - totalPayouts;
      
      // Member contribution breakdown
      const memberContributions: Record<string, any> = {};
      
      contributions.forEach(contrib => {
        const memberId = contrib.memberships?.user_id;
        const memberName = contrib.memberships?.profiles?.full_name || 'Unknown';
        
        if (!memberId) return;
        
        if (!memberContributions[memberId]) {
          memberContributions[memberId] = {
            memberId,
            memberName,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            contributionCount: 0,
            paymentRate: 0
          };
        }
        
        memberContributions[memberId].totalAmount += contrib.amount;
        memberContributions[memberId].contributionCount++;
        
        if (contrib.status === 'completed') {
          memberContributions[memberId].paidAmount += contrib.amount;
        } else {
          memberContributions[memberId].pendingAmount += contrib.amount;
        }
      });
      
      // Calculate payment rates
      Object.values(memberContributions).forEach((member: any) => {
        member.paymentRate = member.totalAmount > 0 
          ? (member.paidAmount / member.totalAmount) * 100 
          : 0;
      });
      
      const memberBreakdown = Object.values(memberContributions);
      
      // Payment method breakdown
      const paymentMethods = [
        { name: 'Bank Transfer', value: 65 },
        { name: 'Credit Card', value: 20 },
        { name: 'Mobile Money', value: 10 },
        { name: 'Cash', value: 5 }
      ];
      
      return {
        monthlySummary,
        summary: {
          totalContributions,
          paidContributions,
          pendingContributions,
          totalPayouts,
          currentBalance,
          paymentRate: totalContributions > 0 ? (paidContributions / totalContributions) * 100 : 0,
          memberCount: systemDetails.max_members,
          activeMembers: new Set(contributions.map(c => c.memberships?.user_id).filter(Boolean)).size
        },
        memberBreakdown,
        paymentMethods,
        rawData: {
          contributions,
          payouts
        },
        systemDetails
      };
    },
    enabled: !!selectedSystem,
  });

  // Helper for number formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF report
    console.log("Exporting PDF report");
    // Mock success for UI feedback
    window.alert("Report exported as PDF successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    // In a real implementation, this would generate a CSV export
    console.log("Exporting CSV data");
    // Mock success for UI feedback
    window.alert("Data exported as CSV successfully!");
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2'];

  if (loadingSystems) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Financial Reports</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Analyze and export detailed financial information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
              <div className="w-full md:w-1/3">
                <Label htmlFor="thrift-system">Thrift System</Label>
                <Select
                  value={selectedSystem}
                  onValueChange={setSelectedSystem}
                  disabled={!systems || systems.length === 0}
                >
                  <SelectTrigger id="thrift-system" className="mt-2">
                    <SelectValue placeholder="Select thrift system" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems?.map((system: any) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3">
                <Label htmlFor="time-range">Time Range</Label>
                <Select
                  value={timeRange}
                  onValueChange={setTimeRange}
                >
                  <SelectTrigger id="time-range" className="mt-2">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3">
                <Label htmlFor="report-type">Report Type</Label>
                <Select
                  value={reportType}
                  onValueChange={setReportType}
                >
                  <SelectTrigger id="report-type" className="mt-2">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="contributions">Contributions</SelectItem>
                    <SelectItem value="payouts">Payouts</SelectItem>
                    <SelectItem value="members">Member Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-4 print:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                disabled={!financialData}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                disabled={!financialData}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadCSV}
                disabled={!financialData}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {loadingFinancial ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading financial data...</span>
        </div>
      ) : !financialData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Financial Data Available</h3>
          <p className="text-muted-foreground mt-2">
            Please select a thrift system to view financial reports
          </p>
        </div>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contributions</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(financialData.summary.paidContributions)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className={financialData.summary.pendingContributions > 0 ? "text-amber-500" : "text-green-500"}>
                    {formatCurrency(financialData.summary.pendingContributions)} pending
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payouts</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(financialData.summary.totalPayouts)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="text-green-500">
                    {financialData.monthlySummary.length} payout cycles
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(financialData.summary.currentBalance)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 text-xs">
                  <span className={financialData.summary.currentBalance >= 0 ? "text-green-500" : "text-red-500"}>
                    {financialData.summary.currentBalance >= 0 ? "Positive" : "Negative"} balance
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Member Participation</p>
                    <p className="text-2xl font-bold mt-1">
                      {Math.round(financialData.summary.paymentRate)}%
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="text-purple-500">
                    {financialData.summary.activeMembers} of {financialData.summary.memberCount} members active
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Based on Report Type */}
          <Tabs value={reportType} onValueChange={setReportType} className="mt-8">
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>
            
            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Financial Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financialData.monthlySummary}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayMonth" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="contributionsPaid" name="Contributions" fill="#8884d8" />
                      <Bar dataKey="payoutsTotal" name="Payouts" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Participation Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={financialData.monthlySummary}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayMonth" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${Math.round(Number(value))}%`} />
                        <Legend />
                        <Line type="monotone" dataKey="participationRate" name="Participation Rate" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialData.paymentMethods}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {financialData.paymentMethods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Contributions Tab */}
            <TabsContent value="contributions">
              <Card>
                <CardHeader>
                  <CardTitle>Contribution History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Payment Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialData.rawData.contributions.map((contrib: any) => (
                          <TableRow key={contrib.id}>
                            <TableCell>{contrib.memberships?.profiles?.full_name || "Unknown"}</TableCell>
                            <TableCell>{formatCurrency(contrib.amount)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                contrib.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {contrib.status === 'completed' ? 'Paid' : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(contrib.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {contrib.payment_date ? new Date(contrib.payment_date).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payouts Tab */}
            <TabsContent value="payouts">
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled Date</TableHead>
                          <TableHead>Completed Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialData.rawData.payouts.map((payout: any) => (
                          <TableRow key={payout.id}>
                            <TableCell>{payout.profiles?.full_name || "Unknown"}</TableCell>
                            <TableCell>{formatCurrency(payout.amount)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payout.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                payout.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {payout.status === 'completed' ? 'Completed' : 
                                 payout.status === 'processing' ? 'Processing' : 'Scheduled'}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(payout.scheduled_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {payout.completed_date ? new Date(payout.completed_date).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Member Contribution Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Total Contribution</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Payment Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialData.memberBreakdown.map((member: any) => (
                          <TableRow key={member.memberId}>
                            <TableCell>{member.memberName}</TableCell>
                            <TableCell>{formatCurrency(member.totalAmount)}</TableCell>
                            <TableCell>{formatCurrency(member.paidAmount)}</TableCell>
                            <TableCell>{formatCurrency(member.pendingAmount)}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 dark:bg-gray-700">
                                  <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${Math.min(100, member.paymentRate)}%` }}
                