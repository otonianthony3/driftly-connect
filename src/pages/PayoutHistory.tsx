import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { usePayoutApi } from "src/hooks/usePayoutApi";
import { useDebounce } from "src/hooks/useDebounce";
import { formatCurrency } from "src/utils/formatters";
import { trackEvent } from "src/utils/analytics";
import { PAYOUT_STATUS_TYPES, SORT_FIELDS, ITEMS_PER_PAGE } from "src/constants/payouts";

import PayoutFilters from "src/components/payout/PayoutFilters";
import PayoutTable from "src/components/payout/PayoutTable";
import PayoutSummary from "src/components/payout/PayoutSummary";
import PayoutPagination from "src/components/payout/PayoutPagination";
import PayoutModal from "src/components/payout/PayoutModal";
import ExportPayouts from "src/components/payout/ExportPayouts";
import PayoutChart from "src/components/OtherFeatures/PayoutChart";
import ErrorBoundary from "src/components/OtherFeatures/ErrorBoundary";
import LoadingSpinner from "src/components/OtherFeatures/LoadingSpinner";
import EmptyState from "src/components/OtherFeatures/EmptyState";

/**
 * If your API sometimes returns amount as a string,
 * convert it to number in `loadPayouts`.
 */
export interface PayoutData {
  id: string;
  reference: string;
  amount: number; // Keep strictly as number
  status: string;
  date: string;
  scheduled_date?: string;
  thrift_systems?: { name?: string };
  recipient: {
    name: string;
    email: string;
    accountId?: string;
  };
  method: string;
  currency: string;
  processingFee?: number;
  notes?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

interface PayoutApiResponse {
  data: PayoutData[];
  meta?: { total?: number; page?: number };
}

// Define StatusFilterType outside of the component
type StatusFilterType = typeof PAYOUT_STATUS_TYPES.ALL | typeof PAYOUT_STATUS_TYPES.PENDING | 
                        typeof PAYOUT_STATUS_TYPES.COMPLETED | typeof PAYOUT_STATUS_TYPES.FAILED;

const PayoutHistory: React.FC = () => {
  const { fetchPayouts, bulkExportPayouts, isLoading, error } = usePayoutApi();

  // Core state
  const [payoutDataList, setPayoutDataList] = useState<PayoutData[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // UI states
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [selectedPayoutData, setSelectedPayoutData] = useState<PayoutData | null>(null);
  const [selectedPayoutDataIds, setSelectedPayoutDataIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(PAYOUT_STATUS_TYPES.ALL);
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce the search input
  const debouncedSearch = useDebounce(search, 300);

  /**
   * Wrap each React state setter in a small helper function
   * so the child receives a normal function `(value: string) => void`.
   */
  const handleSetSearch = (value: string) => setSearch(value);
  const handleSetStatusFilter = (value: StatusFilterType) => setStatusFilter(value);
  const handleSetSortBy = (value: string) => setSortBy(value);
  const handleSetSortDirection = (value: "asc" | "desc") => setSortDirection(value);
  const handleSetDateRange = (value: string) => setDateRange(value);

  /**
   * Fetch payouts from API
   */
  const loadPayouts = useCallback(async () => {
    try {
      const params = {
        status: statusFilter !== PAYOUT_STATUS_TYPES.ALL ? statusFilter : undefined,
        sortBy,
        sortDirection,
      };

      const response: PayoutApiResponse = await fetchPayouts(params);
      const normalizedData = response.data.map((p) => ({
        ...p,
        amount: typeof p.amount === "string" ? parseFloat(p.amount) : p.amount,
      }));

      setPayoutDataList(normalizedData);
      setCurrentPage(1);

      trackEvent("payouts_loaded", { count: normalizedData.length });
    } catch (err) {
      console.error("[PayoutHistory] Failed to load payouts:", err);
    }
  }, [fetchPayouts, statusFilter, sortBy, sortDirection]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts, refreshTrigger, debouncedSearch]);

  /**
   * Filter payouts based on search
   */
  const filteredPayoutDataList = useMemo(() => {
    if (!debouncedSearch) return payoutDataList;
    const searchTerm = debouncedSearch.toLowerCase();

    return payoutDataList.filter((p) => {
      const amtStr = formatCurrency(p.amount);
      return (
        p.id.toLowerCase().includes(searchTerm) ||
        p.reference.toLowerCase().includes(searchTerm) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm)) ||
        amtStr.toLowerCase().includes(searchTerm)
      );
    });
  }, [payoutDataList, debouncedSearch]);

  /**
   * Paginate the filtered list
   */
  const paginatedPayoutDataList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayoutDataList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPayoutDataList, currentPage]);

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.success("Refreshing payout data");
    trackEvent("payouts_refresh_clicked");
  };

  /**
   * Toggle selection for bulk actions
   */
  const toggleSelectPayoutData = useCallback((id: string) => {
    setSelectedPayoutDataIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  /**
   * Export selected payouts
   */
  const handleExport = useCallback(async (): Promise<void> => {
    setIsExporting(true);
    try {
      if (!selectedPayoutDataIds.length) {
        toast("No payouts selected for export");
        return;
      }
      await bulkExportPayouts(selectedPayoutDataIds);
      toast.success("Export successful");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [bulkExportPayouts, selectedPayoutDataIds]);

  /**
   * Change page in pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * View payout details
   */
  const handleViewDetails = (payout: PayoutData) => {
    setSelectedPayoutData(payout);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter(PAYOUT_STATUS_TYPES.ALL);
    setSortBy("date");
    setSortDirection("desc");
    setDateRange("all");
  };

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try refreshing.</div>}>
      <div className="payout-history">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Payout History</h2>
          <button onClick={handleRefresh} disabled={isLoading}>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <PayoutFilters
          search={search}
          setSearch={handleSetSearch}
          statusFilter={statusFilter}
          setStatusFilter={handleSetStatusFilter}
          sortBy={sortBy}
          setSortBy={handleSetSortBy}
          sortDirection={sortDirection}
          setSortDirection={handleSetSortDirection}
          dateRange={dateRange}
          setDateRange={handleSetDateRange}
          onResetFilters={handleResetFilters}
          disabled={isLoading}
        />

        {/* Summary */}
        <PayoutSummary
          total={filteredPayoutDataList.reduce((sum, p) => sum + p.amount, 0)}
          average={
            filteredPayoutDataList.length
              ? filteredPayoutDataList.reduce((sum, p) => sum + p.amount, 0) /
                filteredPayoutDataList.length
              : 0
          }
        />

        {/* View Mode Toggle */}
        <div style={{ margin: "1rem 0" }}>
          <button
            onClick={() => setViewMode("table")}
            disabled={viewMode === "table"}
            style={{ marginRight: "1rem" }}
          >
            Table View
          </button>
          <button onClick={() => setViewMode("chart")} disabled={viewMode === "chart"}>
            Chart View
          </button>
        </div>

        {/* Main Content */}
        <div>
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div style={{ color: "red" }}>Error: {error}</div>
          ) : filteredPayoutDataList.length === 0 ? (
            <EmptyState title="No payouts found" description="Try adjusting your filters or refreshing." />
          ) : viewMode === "table" ? (
            <PayoutTable
              payouts={paginatedPayoutDataList}
              onViewDetails={handleViewDetails}
              selectedPayoutIds={selectedPayoutDataIds}
              onSelectPayout={toggleSelectPayoutData}
              isLoading={isLoading}
            />
          ) : (
            <PayoutChart payouts={filteredPayoutDataList} isLoading={isLoading} />
          )}
        </div>

        {/* Pagination & Export */}
        <div style={{ marginTop: "1rem" }}>
          <PayoutPagination
            currentPage={currentPage}
            totalItems={filteredPayoutDataList.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
          <ExportPayouts
            onExport={handleExport}
            isExporting={isExporting}
            disabled={isLoading || selectedPayoutDataIds.length === 0}
          >
            Export Payouts
          </ExportPayouts>
        </div>

        {/* Payout Modal */}
        {selectedPayoutData && (
          <PayoutModal
            payout={selectedPayoutData}
            isOpen={!!selectedPayoutData}
            onClose={() => setSelectedPayoutData(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default PayoutHistory;