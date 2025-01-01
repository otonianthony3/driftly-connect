import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ThriftSystem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  members: number;
  maxMembers: number;
}

// Mock data - replace with actual API call when backend is integrated
const fetchThriftSystems = async (): Promise<ThriftSystem[]> => {
  console.log("Fetching thrift systems...");
  // Simulated API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    {
      id: "1",
      name: "Monthly Savings Group",
      amount: 1000,
      frequency: "Monthly",
      members: 8,
      maxMembers: 12
    },
    {
      id: "2",
      name: "Weekly Contributors",
      amount: 500,
      frequency: "Weekly",
      members: 5,
      maxMembers: 10
    }
  ];
};

const ClientDashboard = () => {
  const { toast } = useToast();
  
  const { data: thriftSystems, isLoading } = useQuery({
    queryKey: ['thriftSystems'],
    queryFn: fetchThriftSystems,
  });

  const handleJoinSystem = (systemId: string) => {
    console.log("Joining system:", systemId);
    toast({
      title: "Request Sent",
      description: "Your request to join the thrift system has been sent to the admin.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Thrift Systems</h1>
        <p className="text-muted-foreground mt-2">
          Browse and join available thrift systems
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {thriftSystems?.map((system) => (
          <Card key={system.id}>
            <CardHeader>
              <CardTitle>{system.name}</CardTitle>
              <CardDescription>
                {system.frequency} contribution of ${system.amount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="font-medium">
                    {system.members}/{system.maxMembers}
                  </span>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleJoinSystem(system.id)}
                  disabled={system.members >= system.maxMembers}
                >
                  {system.members >= system.maxMembers ? "Full" : "Join System"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientDashboard;