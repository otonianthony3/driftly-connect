import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MemberManagementProps {
  thriftSystemId: string;
}

const MemberManagement = ({ thriftSystemId }: MemberManagementProps) => {
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
            avatar_url
          )
        `)
        .eq('thrift_system_id', thriftSystemId);

      if (error) throw error;
      return data;
    },
  });

  const handleMemberAction = async (memberId: string, action: 'approve' | 'remove') => {
    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('memberships')
          .update({ status: 'active' })
          .eq('id', memberId);

        if (error) throw error;
        toast.success("Member approved successfully");
      } else {
        const { error } = await supabase
          .from('memberships')
          .delete()
          .eq('id', memberId);

        if (error) throw error;
        toast.success("Member removed successfully");
      }
    } catch (error) {
      console.error(`Error ${action}ing member:`, error);
      toast.error(`Failed to ${action} member`);
    }
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
              <TableHead>Join Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.profiles.full_name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    member.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status}
                  </span>
                </TableCell>
                <TableCell>
                  {member.join_date 
                    ? new Date(member.join_date).toLocaleDateString()
                    : 'Pending'}
                </TableCell>
                <TableCell>
                  {member.status === 'pending' ? (
                    <Button 
                      size="sm"
                      onClick={() => handleMemberAction(member.id, 'approve')}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMemberAction(member.id, 'remove')}
                    >
                      Remove
                    </Button>
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