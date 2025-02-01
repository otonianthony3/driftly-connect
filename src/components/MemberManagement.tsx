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

interface MemberManagementProps {
  thriftSystemId: string;
}

const MemberManagement = ({ thriftSystemId }: MemberManagementProps) => {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', thriftSystemId],
    queryFn: async () => {
      console.log("Fetching members for system:", thriftSystemId);
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('thrift_system_id', thriftSystemId);

      if (error) throw error;
      return data;
    },
  });

  const memberActionMutation = useMutation({
    mutationFn: async ({ memberId, action, role }: { memberId: string; action: 'approve' | 'remove' | 'promote' | 'demote'; role?: string }) => {
      console.log(`Performing ${action} action on member:`, memberId);
      
      if (action === 'approve') {
        const { error } = await supabase
          .from('memberships')
          .update({ 
            status: 'active',
            join_date: new Date().toISOString()
          })
          .eq('id', memberId);
        if (error) throw error;
      } else if (action === 'remove') {
        const { error } = await supabase
          .from('memberships')
          .delete()
          .eq('id', memberId);
        if (error) throw error;
      } else if (action === 'promote' || action === 'demote') {
        const { error } = await supabase
          .from('memberships')
          .update({ role })
          .eq('id', memberId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members', thriftSystemId] });
      toast.success(`Member ${variables.action}d successfully`);
    },
    onError: (error) => {
      console.error('Error performing member action:', error);
      toast.error('Failed to perform action on member');
    },
  });

  const handleMemberAction = (memberId: string, action: 'approve' | 'remove' | 'promote' | 'demote', role?: string) => {
    memberActionMutation.mutate({ memberId, action, role });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
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
                <TableCell>{member.profiles.full_name}</TableCell>
                <TableCell>
                  <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1">
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
                    <Button 
                      size="sm"
                      onClick={() => handleMemberAction(member.id, 'approve')}
                    >
                      Approve
                    </Button>
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MemberManagement;