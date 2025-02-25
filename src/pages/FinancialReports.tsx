import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, DollarSign, User, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FinancialReports = () => {
  const [selectedThriftSystem, setSelectedThriftSystem] = useState<string | null>(null);
  const [reportType, setReportType] = useState("summary");
  const [financialData, setFinancialData] = useState<any>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: thriftSystems, isLoading: loadingThriftSystems } = useQuery({
    queryKey: ['thriftSystems'],
    queryFn: async () => {
      const { data } = await supabase.from('thrift_systems').select('id, name');
      return data;
    },
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!selectedThriftSystem) return;

      setLoadingFinancial(true);
      try {
        // Mock financial data fetching
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = {
          summary: {
            totalContributions: 5000,
            totalPayouts: 4500,
            balance: 500,
            memberCount: 10,
          },
          rawData: {
            contributions: [
              { id: 'c1', member_id: 'm1', amount: 500, status: 'completed', due_date: new Date(), payment_date: new Date(), memberships: { profiles: { full_name: 'John Doe' } } },
              { id: 'c2', member_id: 'm2', amount: 500, status: 'pending', due_date: new Date(), payment_date: null, memberships: { profiles: { full_name: 'Jane Smith' } } },
            ],
            payouts: [
              { id: 'p1', member_id: 'm1', amount: 450, status: 'completed', scheduled_date: new Date(), completed_date: new Date(), memberships: { profiles: { full_name: 'John Doe' } } },
              { id: 'p2', member_id: 'm2', amount: 450, status: 'pending', scheduled_date: new Date(), completed_date: null, memberships: { profiles: { full_name: 'Jane Smith' } } },
            ],
            members: [
              { id: 'm1', full_name: 'John Doe', join_date: new Date() },
              { id: 'm2', full_name: 'Jane Smith', join_date: new Date() },
            ],
          },
        };
        setFinancialData(mockData);
      } catch (error) {
        console.error("Failed to fetch financial data", error);
      } finally {
        setLoadingFinancial(false);
      }
    };

    fetchFinancialData();
  }, [selectedThriftSystem]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loadingThriftSystems) {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="thriftSystem">Select Thrift System</Label>
                <Select onValueChange={(value) => setSelectedThriftSystem(value)}>
                  <SelectTrigger id="thriftSystem">
                    <SelectValue placeholder="Choose a system" />
                  </SelectTrigger>
                  <SelectContent>
                    {thriftSystems?.map((system: any) => (
                      <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? new Date(date).toLocaleDateString() : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center" side="bottom">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2020-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button>Export Report</Button>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.summary.totalContributions)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.summary.totalPayouts)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.summary.balance)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialData.summary.memberCount}
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
                  <CardTitle>Summary Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p>Total Contributions: {formatCurrency(financialData.summary.totalContributions)}</p>
                    <p>Total Payouts: {formatCurrency(financialData.summary.totalPayouts)}</p>
                    <p>Current Balance: {formatCurrency(financialData.summary.balance)}</p>
                    <p>Total Members: {financialData.summary.memberCount}</p>
                  </div>
                </CardContent>
              </Card>
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
                            <TableCell>{payout.memberships?.profiles?.full_name || "Unknown"}</TableCell>
                            <TableCell>{formatCurrency(payout.amount)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payout.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {payout.status}
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
                  <CardTitle>Members List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Join Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialData.rawData.members.map((member: any) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.full_name}</TableCell>
                            <TableCell>{new Date(member.join_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default FinancialReports;
