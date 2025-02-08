
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function BankAccountList() {
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
              <Badge
                variant={
                  account.verification_status === "verified"
                    ? "success"
                    : "secondary"
                }
              >
                {account.verification_status}
              </Badge>
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
