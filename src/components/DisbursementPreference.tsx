
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DisbursementPreferenceProps {
  open: boolean;
  onClose: () => void;
  thriftSystemId: string;
  maxMembers: number;
}

export const DisbursementPreference = ({
  open,
  onClose,
  thriftSystemId,
  maxMembers,
}: DisbursementPreferenceProps) => {
  const [preferredPosition, setPreferredPosition] = useState<number>(1);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [showBidding, setShowBidding] = useState<boolean>(false);
  const [showPositions, setShowPositions] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Query to get the current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });
  
  // Query existing preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery({
    queryKey: ['preferences', thriftSystemId],
    queryFn: async () => {
      const { data: prefsData, error: prefsError } = await supabase
        .from('disbursement_preferences')
        .select(`
          id,
          preferred_position, 
          member_id,
          bid_amount,
          status,
          profiles (
            full_name
          )
        `)
        .eq('thrift_system_id', thriftSystemId)
        .order('preferred_position');

      if (prefsError) throw prefsError;
      
      // Get already assigned positions - since there's no position column in payouts,
      // we'll use scheduled payouts as assigned positions and map their array index + 1 as position
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select(`
          member_id,
          status,
          profiles (
            full_name
          )
        `)
        .eq('thrift_system_id', thriftSystemId)
        .order('scheduled_date');
        
      if (payoutsError) throw payoutsError;
      
      // Map the payouts data to include a position number based on array index
      const assignedPositions = payoutsData ? payoutsData.map((payout, index) => ({
        ...payout,
        position: index + 1
      })) : [];
      
      return {
        preferences: prefsData || [],
        assignedPositions: assignedPositions
      };
    },
    enabled: open
  });

  // Query to get user's current preference
  const { data: userPreference } = useQuery({
    queryKey: ['userPreference', thriftSystemId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      
      const { data, error } = await supabase
        .from('disbursement_preferences')
        .select('*')
        .eq('thrift_system_id', thriftSystemId)
        .eq('member_id', currentUser.id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser && open
  });

  // Effect to set initial values when user preference is loaded
  useEffect(() => {
    if (userPreference) {
      setPreferredPosition(userPreference.preferred_position);
      setBidAmount(userPreference.bid_amount?.toString() || "");
    }
  }, [userPreference]);
  
  // Check if position is already taken
  const isPositionTaken = (position: number) => {
    const takenByPreference = preferences?.preferences.some(
      pref => pref.preferred_position === position && pref.member_id !== currentUser?.id
    );
    
    const takenByPayout = preferences?.assignedPositions.some(
      payout => payout.position === position
    );
    
    return takenByPreference || takenByPayout;
  };
  
  // Check if a position is already assigned/finalized
  const isPositionAssigned = (position: number) => {
    return preferences?.assignedPositions.some(
      payout => payout.position === position
    );
  };

  // Get position status
  const getPositionStatus = (position: number) => {
    const assignedPayout = preferences?.assignedPositions.find(
      payout => payout.position === position
    );
    
    if (assignedPayout) {
      return {
        assigned: true,
        memberId: assignedPayout.member_id,
        memberName: assignedPayout.profiles?.full_name,
        status: assignedPayout.status
      };
    }
    
    const pendingPreference = preferences?.preferences.find(
      pref => pref.preferred_position === position
    );
    
    if (pendingPreference) {
      return {
        assigned: false,
        memberId: pendingPreference.member_id,
        memberName: pendingPreference.profiles?.full_name,
        bidAmount: pendingPreference.bid_amount,
        status: pendingPreference.status
      };
    }
    
    return {
      assigned: false,
      available: true
    };
  };

  // Mutation to save preference
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");

      // Check if position is already assigned
      if (isPositionAssigned(preferredPosition)) {
        throw new Error("This position has already been assigned and cannot be selected.");
      }

      // Check if user already has a preference
      const { data: existing } = await supabase
        .from('disbursement_preferences')
        .select()
        .eq('member_id', currentUser.id)
        .eq('thrift_system_id', thriftSystemId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('disbursement_preferences')
          .update({
            preferred_position: preferredPosition,
            bid_amount: bidAmount ? Number(bidAmount) : 0,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('disbursement_preferences')
          .insert({
            thrift_system_id: thriftSystemId,
            member_id: currentUser.id,
            preferred_position: preferredPosition,
            bid_amount: bidAmount ? Number(bidAmount) : 0,
            status: 'pending'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', thriftSystemId] });
      queryClient.invalidateQueries({ queryKey: ['userPreference', thriftSystemId, currentUser?.id] });
      toast.success("Preference saved successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error saving preference:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save preference. Please try again.");
    }
  });

  const handleSave = () => {
    if (preferredPosition < 1 || preferredPosition > maxMembers) {
      toast.error(`Position must be between 1 and ${maxMembers}`);
      return;
    }

    if (isPositionTaken(preferredPosition) && (!bidAmount || Number(bidAmount) <= 0)) {
      toast.error("Please enter a bid amount for this position as it's already taken");
      return;
    }

    saveMutation.mutate();
  };

  const renderAvailablePositions = () => {
    const positions = Array.from({ length: maxMembers }, (_, i) => i + 1);
    
    return (
      <div className="max-h-96 overflow-y-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Bid Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map(position => {
              const status = getPositionStatus(position);
              return (
                <TableRow 
                  key={position} 
                  className={status.memberId === currentUser?.id ? "bg-muted/50" : ""}
                >
                  <TableCell>{position}</TableCell>
                  <TableCell>
                    {status.assigned ? (
                      <Badge variant="default">Assigned</Badge>
                    ) : status.memberId ? (
                      <Badge variant="secondary">Requested</Badge>
                    ) : (
                      <Badge variant="outline">Available</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.memberName || "-"}
                    {status.memberId === currentUser?.id && " (You)"}
                  </TableCell>
                  <TableCell>
                    {status.bidAmount ? `$${status.bidAmount}` : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loadingPreferences) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Disbursement Position</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowPositions(!showPositions)}
            >
              {showPositions ? "Hide" : "View"} Position Chart
            </Button>
            
            <Button 
              variant="secondary"
              onClick={() => setShowBidding(!showBidding)}
            >
              {showBidding ? "Hide" : "Show"} Bidding Info
            </Button>
          </div>
          
          {showBidding && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">How Bidding Works</h3>
              <p className="text-sm mb-2">
                If multiple members want the same position, the highest bid gets priority.
              </p>
              <p className="text-sm">
                Bids are deducted from your payout amount. If another member outbids you,
                your bid amount is returned.
              </p>
            </div>
          )}
          
          {showPositions && renderAvailablePositions()}
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="position">Preferred Position (1-{maxMembers})</Label>
              <Select 
                value={preferredPosition.toString()} 
                onValueChange={(value) => setPreferredPosition(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxMembers }, (_, i) => i + 1).map((pos) => (
                    <SelectItem 
                      key={pos} 
                      value={pos.toString()} 
                      disabled={isPositionAssigned(pos)}
                    >
                      Position {pos} 
                      {isPositionAssigned(pos) ? " (Assigned)" : 
                       isPositionTaken(pos) ? " (Bidding Required)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isPositionTaken(preferredPosition) && !isPositionAssigned(preferredPosition) && (
              <div className="space-y-2">
                <Label htmlFor="bidAmount">Bid Amount</Label>
                <Input
                  id="bidAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount for this position"
                />
                <p className="text-sm text-muted-foreground">
                  This position is already requested by another member. You can bid for it.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending || (isPositionAssigned(preferredPosition))}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preference"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
