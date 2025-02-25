
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContributionTrackerProps {
  thriftSystemId: string;
}

const ContributionTracker = ({ thriftSystemId }: ContributionTrackerProps) => {
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedContribution, setSelectedContribution] = useState<any>(null);
  
  // Get data about the current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  // Get the thrift system details
  const { data: thriftSystem } = useQuery({
    queryKey: ['thriftSystem', thriftSystemId],
    queryFn: async () => {
      if (!thriftSystemId) return null;
      const { data, error } = await supabase
        .from('thrift_systems')
        .select('*')
        .eq('id', thriftSystemId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(thriftSystemId),
  });

  // Get the membership for the current user in this thrift system
  const { data: membership } = useQuery({
    queryKey: ['membership', thriftSystemId, currentUser?.id],
    queryFn: async () => {
      if (!thriftSystemId || !currentUser) return null;
      
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('thrift_system_id', thriftSystemId)
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      
      return data;
    },
    enabled: Boolean(thriftSystemId) && Boolean(currentUser),
  });

  // Get all contributions for this thrift system
  const { data: contributions, isLoading } = useQuery({
    queryKey: ['contributions', thriftSystemId],
    queryFn: async () => {
      if (!thriftSystemId) return [];
      
      console.log("Fetching contributions for system:", thriftSystemId);
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          memberships (
            id,
            user_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('memberships.thrift_system_id', thriftSystemId);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(thriftSystemId),
  });

  // Get user's contributions
  const { data: userContributions } = useQuery({
    queryKey: ['userContributions', membership?.id],
    queryFn: async () => {
      if (!membership) return [];
      
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('membership_id', membership.id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(membership),
  });

  // Make a payment
  const paymentMutation = useMutation({
    mutationFn: async ({
      contributionId,
      amount
    }: {
      contributionId: string;
      amount: number;
    }) => {
      if (!currentUser) throw new Error("Not authenticated");
      
      // In a real implementation, you would integrate with a payment gateway here
      // For now, we'll simulate a successful payment
      
      // Update the contribution status
      const { error } = await supabase
        .from('contributions')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString(),
          amount
        })
        .eq('id', contributionId);
      
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Payment processed successfully!");
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['userContributions'] });
      setShowPaymentDialog(false);
    },
    onError: (error) => {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    }
  });

  const handlePaymentClick = (contribution: any) => {
    setSelectedContribution(contribution);
    setPaymentAmount(contribution.amount.toString());
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedContribution) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    paymentMutation.mutate({
      contributionId: selectedContribution.id,
      amount
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Contribution Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Calculate contribution progress
  const totalContributed = contributions?.reduce(
    (sum, contrib) => sum + (contrib.status === 'completed' ? contrib.amount : 0),
    0
  ) || 0;

  const totalExpected = (thriftSystem?.contribution_amount || 0) * 
    (contributions?.filter(c => c.memberships?.user_id).length || 0);

  const progressPercentage = totalExpected > 0 
    ? Math.min(100, (totalContributed / totalExpected) * 100) 
    : 0;

  // Find the next due contribution for current user
  const nextDueContribution = userContributions?.find(c => c.status === 'pending');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Contribution Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Total Contributed</span>
              <span className="text-sm font-medium">${totalContributed}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-muted-foreground">
                {progressPercentage.toFixed(0)}% of ${totalExpected}
              </span>
            </div>
          </div>
          
          {nextDueContribution && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium mb-2">Your Next Contribution</h3>
              <div className="flex justify-between text-sm mb-3">
                <span>Due Date</span>
                <span>{new Date(nextDueContribution.due_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span>Amount</span>
                <span>${nextDueContribution.amount}</span>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handlePaymentClick(nextDueContribution)}
              >
                Make Payment
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-medium">Recent Contributions</h3>
            {contributions && contributions.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {contributions.slice(0, 10).map((contribution) => (
                  <div key={contribution.id} className="flex justify-between items-center text-sm p-2 bg-card border rounded-md">
                    <div className="flex items-center gap-2">
                      {contribution.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span>{contribution.memberships?.profiles?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>${contribution.amount}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        contribution.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contribution.status}
                      </span>
                      {contribution.status === 'pending' && 
                        contribution.memberships?.user_id === currentUser?.id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePaymentClick(contribution)}
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No contributions found
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Process your contribution payment for this cycle.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Due Date:</span>
              <span>
                {selectedContribution && new Date(selectedContribution.due_date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={paymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentSubmit}
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ContributionTracker;
