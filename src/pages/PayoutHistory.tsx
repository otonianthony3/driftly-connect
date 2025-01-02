import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PayoutHistory = () => {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: async () => {
      console.log("Fetching user payouts...");
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          thrift_systems (
            name,
            payout_schedule
          )
        `)
        .eq('member_id', userData.user?.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Payout History</h1>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Your Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thrift System</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts?.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.thrift_systems.name}</TableCell>
                    <TableCell>${payout.amount}</TableCell>
                    <TableCell>
                      {new Date(payout.scheduled_date).toLocaleDateString()}
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
                    <TableCell>
                      {payout.completed_date 
                        ? new Date(payout.completed_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {payouts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payouts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayoutHistory;