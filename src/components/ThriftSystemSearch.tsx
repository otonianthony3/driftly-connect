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

const ThriftSystemSearch = () => {
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
    navigate(`/thrift-system/${systemId}`);
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
          <div className="flex gap-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              className="border rounded px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Input
              type="number"
              placeholder="Min amount"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="max-w-[150px]"
            />
            <Input
              type="number"
              placeholder="Max amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="max-w-[150px]"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
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
                  <TableRow key={system.id}>
                    <TableCell>{system.name}</TableCell>
                    <TableCell>
                      <Badge variant={system.status === 'active' ? 'default' : 'secondary'}>
                        {system.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${system.contribution_amount}</TableCell>
                    <TableCell>{system.payout_schedule}</TableCell>
                    <TableCell>{new Date(system.created_at || '').toLocaleDateString()}</TableCell>
                    <TableCell>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThriftSystemSearch;
