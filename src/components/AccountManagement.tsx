import { useState } from "react";
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

  const handleDeactivateAccount = async () => {
    try {
      setIsDeactivating(true);
      console.log("Deactivating account...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // First, update the profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'deactivated' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Then, sign out the user
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
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