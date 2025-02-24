
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BankAccountList({ onEdit }: { onEdit: (account: any) => void }) {
  const queryClient = useQueryClient();

  const { data: bankAccounts, isLoading } = useQuery({
    queryKey: ["bankAccounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", accountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      toast.success("Bank account deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete bank account");
      console.error("Delete error:", error);
    }
  });

  if (isLoading) {
    return <div>Loading bank accounts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bankAccounts?.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between border p-4 rounded-lg"
            >
              <div>
                <p className="font-medium">{account.bank_name}</p>
                <p className="text-sm text-muted-foreground">
                  {account.account_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {account.account_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    account.verification_status === "verified"
                      ? "success"
                      : "secondary"
                  }
                >
                  {account.verification_status}
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(account)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {(!bankAccounts || bankAccounts.length === 0) && (
            <p className="text-center text-muted-foreground">
              No bank accounts added yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
