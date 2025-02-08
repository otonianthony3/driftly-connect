
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const queryClient = useQueryClient();

  // Query existing preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences', thriftSystemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disbursement_preferences')
        .select('preferred_position, member_id')
        .eq('thrift_system_id', thriftSystemId)
        .order('preferred_position');

      if (error) throw error;
      return data;
    }
  });

  // Check if position is already taken
  const isPositionTaken = (position: number) => {
    return preferences?.some(pref => pref.preferred_position === position);
  };

  // Mutation to save preference
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Check if user already has a preference
      const { data: existing } = await supabase
        .from('disbursement_preferences')
        .select()
        .eq('member_id', user.id)
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
            member_id: user.id,
            preferred_position: preferredPosition,
            bid_amount: bidAmount ? Number(bidAmount) : 0,
            status: 'pending'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', thriftSystemId] });
      toast.success("Preference saved successfully!");
      onClose();
    },
    onError: (error) => {
      console.error("Error saving preference:", error);
      toast.error("Failed to save preference. Please try again.");
    }
  });

  const handleSave = () => {
    if (preferredPosition < 1 || preferredPosition > maxMembers) {
      toast.error(`Position must be between 1 and ${maxMembers}`);
      return;
    }

    if (isPositionTaken(preferredPosition)) {
      if (!bidAmount || Number(bidAmount) <= 0) {
        toast.error("Please enter a bid amount for this position as it's already taken");
        return;
      }
    }

    saveMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Disbursement Position</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Preferred Position (1-{maxMembers})</Label>
            <Input
              type="number"
              min={1}
              max={maxMembers}
              value={preferredPosition}
              onChange={(e) => setPreferredPosition(Number(e.target.value))}
            />
          </div>

          {isPositionTaken(preferredPosition) && (
            <div className="space-y-2">
              <Label>Bid Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount for this position"
              />
              <p className="text-sm text-muted-foreground">
                This position is already taken. You can bid for it.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Preference
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
