import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import CreateThriftSystem from "@/components/CreateThriftSystem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ThriftAnalytics from "@/components/ThriftAnalytics";
import ThriftSystemSearch from "@/components/ThriftSystemSearch";
import { ThriftSystem } from "@/types/database";

const AdminDashboard = () => {
  const [showCreateThrift, setShowCreateThrift] = useState(false);
  const navigate = useNavigate();
  console.log("Admin Dashboard rendered");

  const { data: thriftSystems, isLoading } = useQuery({
    queryKey: ['adminThriftSystems'],
    queryFn: async () => {
      // First get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log("Fetching thrift systems for admin:", user.id);
      
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
        .eq('admin_id', user.id);

      if (error) throw error;

      return data.map(system => ({
        id: system.id,
        name: system.name,
        total_members: system.memberships.filter(m => m.status === 'active').length,
        pending_requests: system.memberships.filter(m => m.status === 'pending').length
      }));
    },
    retry: false,
    enabled: true
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your thrift systems</p>
        </div>
        
        <div className="grid gap-6">
          <ThriftAnalytics />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation" 
              onClick={() => setShowCreateThrift(true)}
            >
              <CardContent className="flex items-center p-6">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-4" />
                <div>
                  <h3 className="font-semibold">Create Thrift System</h3>
                  <p className="text-sm text-muted-foreground">Set up a new thrift group</p>
                </div>
              </CardContent>
            </Card>

            {thriftSystems?.map((system) => (
              <Card 
                key={system.id}
                className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
                onClick={() => navigate(`/thrift-system/${system.id}`)}
              >
                <CardContent className="flex items-center p-6">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-4" />
                  <div>
                    <h3 className="font-semibold line-clamp-1">{system.name}</h3>
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

          <ThriftSystemSearch />
        </div>

        {showCreateThrift && (
          <CreateThriftSystem 
            open={showCreateThrift} 
            onClose={() => setShowCreateThrift(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;