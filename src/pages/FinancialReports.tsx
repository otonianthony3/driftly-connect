
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import FinancialReportDetail from "@/components/FinancialReportDetail";

const FinancialReports = () => {
  const [selectedThriftSystem, setSelectedThriftSystem] = useState<string>("all");

  // Fetch user's thrift systems
  const { data: thriftSystems, isLoading: loadingThriftSystems } = useQuery({
    queryKey: ['thrift-systems-for-reports'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('thrift_systems')
        .select(`
          id,
          name,
          contribution_amount,
          payout_schedule,
          status,
          admin_id
        `)
        .or(`admin_id.eq.${session.session.user.id},memberships.user_id.eq.${session.session.user.id}`)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    }
  });

  const isSystemAdmin = (systemId: string) => {
    const system = thriftSystems?.find(s => s.id === systemId);
    if (!system) return false;
    
    return system.admin_id === supabase.auth.getUser().then(({ data }) => data.user?.id);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your financial activities and track contribution patterns
          </p>
        </div>
        
        {!loadingThriftSystems && thriftSystems && thriftSystems.length > 0 && (
          <div className="w-full sm:w-auto">
            <Select value={selectedThriftSystem} onValueChange={setSelectedThriftSystem}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select thrift system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Thrift Systems</SelectItem>
                {thriftSystems.map(system => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loadingThriftSystems ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports">
            <FinancialReportDetail 
              thriftSystemId={selectedThriftSystem !== "all" ? selectedThriftSystem : undefined} 
            />
          </TabsContent>
          
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Savings Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    {selectedThriftSystem === "all"
                      ? "Your overall savings have grown steadily over time. Continue maintaining your contribution schedule to maximize benefits."
                      : `This thrift system has been performing well. The consistent contributions from members have led to a healthy financial state.`
                    }
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Growth Rate</p>
                      <p className="text-2xl font-bold text-green-600">+12.4%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Projected Annual Value</p>
                      <p className="text-2xl font-bold">$4,250</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contribution Consistency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    {selectedThriftSystem === "all"
                      ? "You've maintained a strong contribution consistency across your thrift systems. This is key to achieving your financial goals."
                      : `Members of this thrift system have shown excellent contribution consistency. This regularity ensures timely payouts for everyone.`
                    }
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">On-time Rate</p>
                      <p className="text-2xl font-bold text-green-600">94%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Missed Contributions</p>
                      <p className="text-2xl font-bold text-amber-600">3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Optimize Your Contribution Schedule</p>
                        <p className="text-muted-foreground">
                          Align your contributions with your income schedule to avoid delays and maintain a high consistency rate.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Diversify Your Thrift Systems</p>
                        <p className="text-muted-foreground">
                          Consider joining multiple thrift systems with different payout schedules to create a steady cash flow throughout the year.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Set Up Automatic Payments</p>
                        <p className="text-muted-foreground">
                          Configure automatic payments to ensure you never miss a contribution deadline, maintaining your perfect record.
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default FinancialReports;
