import React, { useState, useEffect } from "react";
import { Search, X, Filter, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Props interface for PayoutFilters
 */
interface PayoutFiltersProps {
  /** The current search string */
  search: string;
  /** Function to set the search string */
  setSearch: (value: string) => void;

  /** The current status filter (e.g. "all", "pending", "completed") */
  statusFilter: string;
  /** Function to set the status filter */
  setStatusFilter: (value: string) => void;

  /** The current sort field (e.g. "date", "amount", "name", "status") */
  sortBy: string;
  /** Function to set the sort field */
  setSortBy: (value: string) => void;

  /** The current sort direction ("asc" | "desc") */
  sortDirection: "asc" | "desc";
  /** Function to set the sort direction */
  setSortDirection: (value: "asc" | "desc") => void;

  /** The current date range filter (e.g. "all", "today", "lastWeek") */
  dateRange: string;
  /** Function to set the date range */
  setDateRange: (value: string) => void;

  /** Function to reset all filters */
  onResetFilters: () => void;

  /** Whether to disable filter inputs (e.g. when loading) */
  disabled?: boolean;
}

const PayoutFilters: React.FC<PayoutFiltersProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  dateRange,
  setDateRange,
  onResetFilters,
  disabled = false,
}) => {
  const [activeFilters, setActiveFilters] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters for the badge
  useEffect(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter !== "all") count++;
    if (dateRange !== "all") count++;
    setActiveFilters(count);
  }, [search, statusFilter, dateRange]);

  // Clear individual filters
  const clearSearch = () => setSearch("");
  const clearStatus = () => setStatusFilter("all");
  const clearDateRange = () => setDateRange("all");

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg border shadow-sm p-4 mb-6">
      {/* Main filters row with expand/collapse */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
        {/* Search Input */}
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search payouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8"
            disabled={disabled}
          />
          {search && (
            <X
              className="absolute right-3 top-2.5 text-gray-400 cursor-pointer"
              size={16}
              onClick={clearSearch}
            />
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction */}
        <Button onClick={toggleSortDirection} disabled={disabled}>
          {sortDirection === "asc" ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
          {sortDirection === "asc" ? "Ascending Order" : "Descending Order"}
        </Button>

        {/* Expandable Filters Button */}
        <Button onClick={() => setIsExpanded(!isExpanded)} disabled={disabled}>
          {isExpanded ? "Less Filters" : "More Filters"}
          {activeFilters > 0 && <Badge>{activeFilters}</Badge>}
        </Button>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="mt-2">
          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="thrift_system">Thrift System</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Select value={dateRange} onValueChange={setDateRange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="lastWeek">Last 7 days</SelectItem>
              <SelectItem value="lastMonth">Last 30 days</SelectItem>
              <SelectItem value="lastQuarter">Last 90 days</SelectItem>
              <SelectItem value="thisYear">This year</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          <div className="flex space-x-2 mt-2">
            <Button onClick={onResetFilters} disabled={disabled}>
              Reset All
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Indicator */}
      {activeFilters > 0 && (
        <div className="mt-2">
          <strong>Active filters:</strong>
          {search && (
            <Badge>
              Search: {search.length > 10 ? `${search.substring(0, 10)}...` : search}
            </Badge>
          )}
          {statusFilter !== "all" && <Badge>Status: {statusFilter}</Badge>}
          {dateRange !== "all" && <Badge>Date: {dateRange}</Badge>}
        </div>
      )}
    </div>
  );
};

export default PayoutFilters;