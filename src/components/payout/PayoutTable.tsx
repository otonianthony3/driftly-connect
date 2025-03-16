import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Search,
  ChevronUp,
  ChevronDown,
  Calendar,
  DollarSign,
} from "lucide-react";

/** 
 * Matches the parent's `PayoutData` exactly. 
 * 
 * Parent says:
 * 
 * export interface PayoutData {
 *   id: string;
 *   reference: string;
 *   amount: number;
 *   status: string;
 *   date: string;
 *   scheduled_date?: string;
 *   thrift_systems?: { name?: string };
 *   recipient: { ... };
 *   method: string;
 *   currency: string;
 *   processingFee?: number;
 *   notes?: string;
 *   metadata?: Record<string, any>;
 *   [key: string]: any;
 * }
 */
interface PayoutData {
  id: string;
  reference: string;
  amount: number;  // numeric
  status: string;
  date: string;
  scheduled_date?: string;
  thrift_systems?: { name?: string };
  // The table doesn’t use these, but we keep them optional so TS doesn’t complain
  recipient?: { 
    name?: string; 
    email?: string; 
    accountId?: string;
  };
  method?: string;
  currency?: string;
  processingFee?: number;
  notes?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Matches the props used by the parent code:
 * <PayoutTable
 *   payouts={paginatedPayoutDataList}
 *   onViewDetails={setSelectedPayoutData}
 *   selectedPayoutIds={selectedPayoutDataIds}
 *   onSelectPayout={toggleSelectPayoutData}
 *   isLoading={isLoading}
 * />
 */
interface PayoutTableProps {
  payouts: PayoutData[];
  onViewDetails: (payout: PayoutData) => void;
  selectedPayoutIds: string[];
  onSelectPayout: (id: string) => void;
  isLoading: boolean;
}

const PayoutTable: React.FC<PayoutTableProps> = ({
  payouts,
  onViewDetails,
  selectedPayoutIds,
  onSelectPayout,
  isLoading,
}) => {
  // Local search/filter (optional)
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Local sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "scheduled_date",
    direction: "desc",
  });

  /**
   * Toggle or set the sort configuration
   */
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /**
   * Format currency (NGN)
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * If table is loading, show a loading row
   */
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Payout Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">Loading payouts...</div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Filter + Sort
   */
  const filteredPayouts = useMemo(() => {
    let data = [...payouts];

    // Local searchTerm filter (optional)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((p) => {
        const systemName = p.thrift_systems?.name?.toLowerCase() || "";
        const status = p.status.toLowerCase();
        return systemName.includes(term) || status.includes(term);
      });
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof PayoutData];
        let bValue: any = b[sortConfig.key as keyof PayoutData];

        // For nested property
        if (sortConfig.key === "thrift_systems.name") {
          aValue = a.thrift_systems?.name || "";
          bValue = b.thrift_systems?.name || "";
        }
        // For date fields
        if (sortConfig.key === "scheduled_date" || sortConfig.key === "date") {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        // For amount, it's already numeric

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [payouts, searchTerm, sortConfig]);

  /**
   * Render a small arrow next to sorted columns
   */
  const renderSortIndicator = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <ChevronUp size={16} className="ml-1 inline" />
      ) : (
        <ChevronDown size={16} className="ml-1 inline" />
      );
    }
    return null;
  };

  /**
   * Format date fields
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Render a status badge
   */
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      Completed: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Processing: "bg-blue-100 text-blue-800",
      Scheduled: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={statusStyles[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  /**
   * If no payouts after filtering
   */
  if (!filteredPayouts.length) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Payout Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">No payouts found.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold">Payout Transactions</CardTitle>
          {/* Local search box (optional) */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search payouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => requestSort("thrift_systems.name")}
                >
                  Thrift System {renderSortIndicator("thrift_systems.name")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => requestSort("amount")}
                >
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-1" />
                    Amount {renderSortIndicator("amount")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => requestSort("scheduled_date")}
                >
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    Scheduled Date {renderSortIndicator("scheduled_date")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => requestSort("status")}
                >
                  Status {renderSortIndicator("status")}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout) => {
                const isSelected = selectedPayoutIds.includes(payout.id);
                return (
                  <TableRow key={payout.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {payout.thrift_systems?.name || ""}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>{formatDate(payout.scheduled_date)}</TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-right">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={isSelected}
                        onChange={() => onSelectPayout(payout.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(payout)}
                      >
                        <Eye size={16} className="mr-2" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
interface PayoutFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  disabled?: boolean;
}


export default PayoutTable;