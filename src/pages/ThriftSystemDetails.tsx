import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, Calendar, DollarSign } from "lucide-react";

interface ThriftSystemDetails {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  members: {
    id: string;
    name: string;
    joinedAt: string;
    contributionsMade: number;
  }[];
  maxMembers: number;
  startDate: string;
  nextContributionDate: string;
  totalContributed: number;
  targetAmount: number;
}

// Mock data - replace with actual API call when backend is integrated
const fetchThriftSystemDetails = async (id: string): Promise<ThriftSystemDetails> => {
  console.log("Fetching thrift system details for:", id);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: "1",
    name: "Monthly Savings Group",
    amount: 1000,
    frequency: "Monthly",
    members: [
      {
        id: "1",
        name: "John Doe",
        joinedAt: "2024-01-01",
        contributionsMade: 3,
      },
      {
        id: "2",
        name: "Jane Smith",
        joinedAt: "2024-01-02",
        contributionsMade: 3,
      },
    ],
    maxMembers: 12,
    startDate: "2024-01-01",
    nextContributionDate: "2024-04-01",
    totalContributed: 6000,
    targetAmount: 12000,
  };
};

const ThriftSystemDetails = () => {
  // In a real app, you'd get this from the URL params
  const systemId = "1";

  const { data: system, isLoading } = useQuery({
    queryKey: ['thriftSystem', systemId],
    queryFn: () => fetchThriftSystemDetails(systemId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!system) return null;

  const progressPercentage = (system.totalContributed / system.targetAmount) * 100;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{system.name}</h1>
        <p className="text-muted-foreground mt-2">
          System Details and Progress
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${system.totalContributed}</div>
            <Progress value={progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Target: ${system.targetAmount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {system.members.length}/{system.maxMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Contribution</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(system.nextContributionDate).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {system.frequency} payment of ${system.amount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {system.members.map((member) => (
              <div key={member.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{member.contributionsMade} contributions</p>
                  <p className="text-sm text-muted-foreground">
                    Total: ${member.contributionsMade * system.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThriftSystemDetails;