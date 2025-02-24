
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BankAccount {
  id?: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

interface BankAccountFormProps {
  existingAccount?: BankAccount | null;
  onSuccess?: () => void;
}

export default function BankAccountForm({ existingAccount, onSuccess }: BankAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (existingAccount) {
      setBankName(existingAccount.bank_name);
      setAccountNumber(existingAccount.account_number);
      setAccountName(existingAccount.account_name);
    }
  }, [existingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please log in to add bank account details");
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (existingAccount?.id) {
        // Update existing account
        const { error } = await supabase
          .from("bank_accounts")
          .update({
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
          })
          .eq('id', existingAccount.id);

        if (error) throw error;
        toast.success("Bank account details updated successfully");
      } else {
        // Check if user already has a bank account
        const { data: existingAccounts, error: checkError } = await supabase
          .from("bank_accounts")
          .select("id")
          .eq("user_id", userId);

        if (checkError) throw checkError;

        if (existingAccounts && existingAccounts.length > 0) {
          toast.error("You already have a bank account registered");
          return;
        }

        // Create new account
        const { error } = await supabase
          .from("bank_accounts")
          .insert({
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
            user_id: userId,
          });

        if (error) throw error;
        toast.success("Bank account details saved successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save bank account details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingAccount ? "Edit Bank Account" : "Add Bank Account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting || !userId}>
            {isSubmitting ? "Saving..." : existingAccount ? "Update Bank Details" : "Save Bank Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
