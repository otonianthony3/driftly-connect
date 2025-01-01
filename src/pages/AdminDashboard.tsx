import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Bell, List } from "lucide-react";
import CreateThriftSystem from "@/components/CreateThriftSystem";

const AdminDashboard = () => {
  const [showCreateThrift, setShowCreateThrift] = useState(false);
  console.log("Admin Dashboard rendered");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Quick Actions */}
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="flex items-center p-6">
            <List className="h-6 w-6 mr-4" />
            <div>
              <h3 className="font-semibold">Manage Requests</h3>
              <p className="text-sm text-muted-foreground">Handle join requests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="flex items-center p-6">
            <Users className="h-6 w-6 mr-4" />
            <div>
              <h3 className="font-semibold">View Members</h3>
              <p className="text-sm text-muted-foreground">Manage participants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="flex items-center p-6">
            <Bell className="h-6 w-6 mr-4" />
            <div>
              <h3 className="font-semibold">Monitor Contributions</h3>
              <p className="text-sm text-muted-foreground">Track payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Thrift Systems */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Thrift Systems</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active thrift systems yet.</p>
        </CardContent>
      </Card>

      {/* Create Thrift System Dialog */}
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