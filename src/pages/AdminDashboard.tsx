import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Bell, List } from "lucide-react";
import CreateThriftSystem from "@/components/CreateThriftSystem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ThriftSystemSummary {
  id: string;
  name: string;
  total_members: number;
  pending_requests: number;
}

const AdminDashboard = () => {
  const [showCreateThrift, setShowCreateThrift] = useState(false);
  const navigate = useNavigate();
  console.log("Admin Dashboard rendered");

  const { data: thriftSystems } = useQuery({
    queryKey: ['adminThriftSystems'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('thrift_systems')
        .select(`
          id,
          name,
          memberships!inner (
            id,
            status
          )
        `)
        .eq('admin_id', userData.user?.id);

      if (error) throw error;

      return data.map(system => ({
        id: system.id,
        name: system.name,
        total_members: system.memberships.filter(m => m.status === 'active').length,
        pending_requests: system.memberships.filter(m => m.status === 'pending').length
      }));
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowCreateThrift(true)}>
          <CardContent className="flex items-center p-6">
            <Plus className="h-6 w-6 mr-4" />
            <div>
              <h3 className="font-semibold">Create Thrift System</h3>
              <p className="text-sm text-muted-foreground">Set up a new thrift group</p>
            </div>
          </CardContent>
        </Card>

        {thriftSystems?.map((system) => (
          <Card 
            key={system.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/thrift-system/${system.id}`)}
          >
            <CardContent className="flex items-center p-6">
              <Users className="h-6 w-6 mr-4" />
              <div>
                <h3 className="font-semibold">{system.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {system.total_members} members
                  {system.pending_requests > 0 && (
                    <span className="text-red-500 ml-2">
                      ({system.pending_requests} pending)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreateThrift && (
        <CreateThriftSystem 
          open={showCreateThrift} 
          onClose={() => setShowCreateThrift(false)} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;