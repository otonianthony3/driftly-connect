
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AccountManagement = () => {
  const navigate = useNavigate();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [disabledReason, setDisabledReason] = useState("");

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user is a member of any group
        const { data: memberships, error: membershipError } = await supabase
          .from('memberships')
          .select('id, status')
          .eq('user_id', user.id);

        if (membershipError) throw membershipError;

        // Check if user is an admin of any active group
        const { data: adminGroups, error: adminError } = await supabase
          .from('group_members')
          .select(`
            id, 
            role,
            groups (
              id,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('role', 'admin');

        if (adminError) throw adminError;

        const hasActiveMemberships = memberships && memberships.length > 0;
        const hasActiveAdminGroups = adminGroups && adminGroups.some(
          group => group.groups && group.groups.status === 'active'
        );

        if (hasActiveMemberships) {
          setIsDisabled(true);
          setDisabledReason("You cannot deactivate your account while you are a member of one or more thrift systems.");
        } else if (hasActiveAdminGroups) {
          setIsDisabled(true);
          setDisabledReason("You cannot deactivate your account while you are an admin of active groups.");
        } else {
          setIsDisabled(false);
          setDisabledReason("");
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    checkUserStatus();
  }, []);

  const handleDeactivateAccount = async () => {
    try {
      setIsDeactivating(true);
      console.log("Deactivating account...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'deactivated' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      toast.success("Account deactivated successfully");
      navigate("/login");
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      toast.error(error.message || "Failed to deactivate account");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Account Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Deactivate Account</h3>
          <p className="text-sm text-muted-foreground">
            Deactivating your account will remove you from all thrift systems and hide your profile.
            This action can be reversed by contacting support.
          </p>
          
          {isDisabled && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              {disabledReason}
            </div>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isDisabled}>
                Deactivate Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deactivate Account</DialogTitle>
                <DialogDescription>
                  This action will deactivate your account. To confirm, please type "DEACTIVATE" below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmation</Label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DEACTIVATE to confirm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="destructive"
                    onClick={handleDeactivateAccount}
                    disabled={confirmText !== "DEACTIVATE" || isDeactivating}
                  >
                    {isDeactivating ? "Deactivating..." : "Confirm Deactivation"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountManagement;
