import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MemberManagementProps {
  systemId: string;
}

interface Membership {
  id: string;
  user_id: string;
  status: string;
  join_date?: string;
  // Add more fields if you join with the users table (e.g., name, email)
}

const fetchMemberships = async (systemId: string): Promise<Membership[]> => {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("thrift_system_id", systemId);
  if (error) throw error;
  return data as Membership[];
};

const MemberManagement: React.FC<MemberManagementProps> = ({ systemId }) => {
  const queryClient = useQueryClient();
  const { data: memberships, isLoading, error } = useQuery({
    queryKey: ["memberships", systemId],
    queryFn: () => fetchMemberships(systemId),
    refetchOnWindowFocus: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      // Update the membership status to active
      const { error } = await supabase
        .from("memberships")
        .update({ status: "active" })
        .eq("id", membershipId);
      if (error) throw error;
      return membershipId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["memberships", systemId]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      // Delete the membership record
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", membershipId);
      if (error) throw error;
      return membershipId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["memberships", systemId]);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      // Delete the membership record to remove an active member
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", membershipId);
      if (error) throw error;
      return membershipId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["memberships", systemId]);
    },
  });

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }
  if (error) {
    return <div>Error loading memberships: {(error as Error).message}</div>;
  }

  // Separate pending requests from active memberships
  const pending = memberships?.filter((m) => m.status === "pending") || [];
  const active = memberships?.filter((m) => m.status === "active") || [];

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-bold mb-4">Member Management</h2>

      <section>
        <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <span className="text-sm">{m.user_id}</span>
                <div>
                  <Button
                    variant="success"
                    size="sm"
                    className="mr-2"
                    onClick={() => approveMutation.mutate(m.id)}
                    disabled={approveMutation.isLoading}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => rejectMutation.mutate(m.id)}
                    disabled={rejectMutation.isLoading}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Members</h3>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet</p>
        ) : (
          <ul className="space-y-2">
            {active.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <span className="text-sm">{m.user_id}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to remove this member?"
                      )
                    ) {
                      removeMemberMutation.mutate(m.id);
                    }
                  }}
                  disabled={removeMemberMutation.isLoading}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MemberManagement;
