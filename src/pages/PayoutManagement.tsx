import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PayoutManagement = () => {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      console.log("Fetching admin payouts...");
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          thrift_systems!inner (
            id,
            name,
            admin_id,
            contribution_amount
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('thrift_systems.admin_id', userData.user?.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handlePayoutAction = async (payoutId: string, action: 'process' | 'complete') => {
    try {
      const updates = {
        status: action === 'process' ? 'processing' : 'completed',
        ...(action === 'complete' && { completed_date: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('payouts')
        .update(updates)
        .eq('id', payoutId);

      if (error) throw error;

      toast.success(`Payout ${action === 'process' ? 'processing started' : 'marked as completed'}`);
    } catch (error) {
      console.error(`Error updating payout:`, error);
      toast.error("Failed to update payout status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];
  const processingPayouts = payouts?.filter(p => p.status === 'processing') || [];
  const completedPayouts = payouts?.filter(p => p.status === 'completed') || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Payout Management</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Successfully processed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Scheduled Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thrift System</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts?.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{payout.thrift_systems.name}</TableCell>
                  <TableCell>{payout.profiles.full_name}</TableCell>
                  <TableCell>${payout.amount}</TableCell>
                  <TableCell>
                    {new Date(payout.scheduled_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payout.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : payout.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payout.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payout.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => handlePayoutAction(payout.id, 'process')}
                      >
                        Process
                      </Button>
                    )}
                    {payout.status === 'processing' && (
                      <Button 
                        size="sm"
                        onClick={() => handlePayoutAction(payout.id, 'complete')}
                      >
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!payouts?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No payouts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutManagement;