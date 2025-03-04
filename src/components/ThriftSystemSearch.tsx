
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ThriftSystem } from "@/types/database";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ThriftSystemSearch = ({ isClientView = false }: { isClientView?: boolean }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    minAmount: "",
    maxAmount: "",
  });

  const { data: systems, isLoading } = useQuery({
    queryKey: ['thrift-systems', searchTerm, filters],
    queryFn: async () => {
      console.log("Fetching thrift systems with filters:", { searchTerm, filters });
      let query = supabase
        .from('thrift_systems')
        .select('*');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.minAmount) {
        query = query.gte('contribution_amount', parseFloat(filters.minAmount));
      }

      if (filters.maxAmount) {
        query = query.lte('contribution_amount', parseFloat(filters.maxAmount));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ThriftSystem[];
    },
  });

  const handleViewSystem = (systemId: string) => {
    // Navigate to the client view if isClientView is true
    if (isClientView) {
      navigate(`/thrift-system-view/${systemId}`);
    } else {
      navigate(`/thrift-system/${systemId}`);
    }
  };

  const handleRowClick = (systemId: string) => {
    handleViewSystem(systemId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Thrift Systems
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="w-full"
            />
            
            <Input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="w-full"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contribution Amount</TableHead>
                    <TableHead>Payout Schedule</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systems?.map((system) => (
                    <TableRow 
                      key={system.id} 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleRowClick(system.id)}
                    >
                      <TableCell>{system.name}</TableCell>
                      <TableCell>
                        <Badge variant={system.status === 'active' ? 'default' : 'secondary'}>
                          {system.status}
                        </Badge>
                      </TableCell>
                      <TableCell>₦{system.contribution_amount}</TableCell>
                      <TableCell>{system.payout_schedule}</TableCell>
                      <TableCell>{new Date(system.created_at || '').toLocaleDateString()}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          onClick={() => handleViewSystem(system.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThriftSystemSearch;
