
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Shield } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Membership } from "@/types/database";

interface MemberManagementProps {
  thriftSystemId: string;
}

const MemberManagement = ({ thriftSystemId }: MemberManagementProps) => {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', thriftSystemId],
    queryFn: async () => {
      if (!thriftSystemId) return [];
      
      console.log("Fetching members for system:", thriftSystemId);
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('thrift_system_id', thriftSystemId)
        .order('join_date', { ascending: false });

      if (error) throw error;

      // Filter out duplicate pending requests from the same user
      const uniqueMemberships = memberships.reduce((acc: Membership[], current) => {
        // Only check for duplicates in pending requests
        if (current.status === 'pending') {
          const existingMember = acc.find(
            (item) => item.user_id === current.user_id && item.status === 'pending'
          );
          if (!existingMember) {
            acc.push(current);
          }
        } else {
          // Include all non-pending members
          acc.push(current);
        }
        return acc;
      }, []);

      return uniqueMemberships as Membership[];
    },
    enabled: Boolean(thriftSystemId),
    staleTime: 1000 * 60 // 1 minute
  });

  const memberActionMutation = useMutation({
    mutationFn: async ({ memberId, action, role }: { memberId: string; action: 'approve' | 'reject' | 'remove' | 'promote' | 'demote'; role?: string }) => {
      console.log(`Performing ${action} action on member:`, memberId);
      
      if (action === 'approve') {
        // First, verify the member isn't already in the system
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('id', memberId)
          .single();

        if (!membershipData) throw new Error('Membership not found');

        const { data: existingMember } = await supabase
          .from('memberships')
          .select('id')
          .eq('thrift_system_id', thriftSystemId)
          .eq('user_id', membershipData.user_id)
          .eq('status', 'active')
          .single();

        if (existingMember) {
          throw new Error('Member is already in the system');
        }

        // Update the pending request to active
        const { error: updateError } = await supabase
          .from('memberships')
          .update({ 
            status: 'active',
            join_date: new Date().toISOString(),
            role: 'member'
          })
          .eq('id', memberId);

        if (updateError) throw updateError;

        // Use the RPC function to create a notification
        const { error: notificationError } = await supabase.rpc(
          'create_notification',
          {
            p_user_id: membershipData.user_id,
            p_template_name: 'membership_approved',
            p_data: JSON.stringify({
              thrift_system_id: thriftSystemId
            })
          }
        );

        if (notificationError) throw notificationError;

      } else if (action === 'reject' || action === 'remove') {
        // Get user_id before deleting membership
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('id', memberId)
          .single();

        if (!membershipData) throw new Error('Membership not found');

        // Delete the membership entry
        const { error: deleteError } = await supabase
          .from('memberships')
          .delete()
          .eq('id', memberId);

        if (deleteError) throw deleteError;

        // Only create rejection notification if action is reject (not remove)
        if (action === 'reject') {
          // Use the RPC function to create a notification
          const { error: notificationError } = await supabase.rpc(
            'create_notification',
            {
              p_user_id: membershipData.user_id,
              p_template_name: 'membership_rejected',
              p_data: JSON.stringify({
                thrift_system_id: thriftSystemId
              })
            }
          );

          if (notificationError) throw notificationError;
        }
      } else if (action === 'promote' || action === 'demote') {
        const { error } = await supabase
          .from('memberships')
          .update({ role })
          .eq('id', memberId);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Immediately invalidate the query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['members', thriftSystemId] });
      
      const actionText = {
        approve: 'approved',
        reject: 'rejected',
        remove: 'removed',
        promote: 'promoted',
        demote: 'demoted'
      }[variables.action];
      
      toast.success(`Member ${actionText} successfully`);
    },
    onError: (error: Error) => {
      console.error('Error performing member action:', error);
      toast.error(error.message || 'Failed to perform action on member');
    },
  });

  const handleMemberAction = (memberId: string, action: 'approve' | 'reject' | 'remove' | 'promote' | 'demote', role?: string) => {
    memberActionMutation.mutate({ memberId, action, role });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Member Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.profiles?.full_name}</TableCell>
                <TableCell>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Shield className="h-3 w-3" />
                    {member.role || 'member'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.join_date 
                    ? new Date(member.join_date).toLocaleDateString()
                    : 'Pending'}
                </TableCell>
                <TableCell className="space-x-2">
                  {member.status === 'pending' ? (
                    <>
                      <Button 
                        size="sm"
                        onClick={() => handleMemberAction(member.id, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMemberAction(member.id, 'reject')}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      {member.role !== 'admin' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleMemberAction(member.id, 'promote', 'admin')}
                        >
                          Promote
                        </Button>
                      )}
                      {member.role === 'admin' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleMemberAction(member.id, 'demote', 'member')}
                        >
                          Demote
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            variant="destructive"
                          >
                            Remove
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Member</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to remove this member? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleMemberAction(member.id, 'remove')}
                            >
                              Remove
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(!members || members.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MemberManagement;
