import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Dialog, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Filter, X, ChevronDown, ChevronUp, Eye, UserPlus, PauseCircle, PlayCircle } from "lucide-react";

interface ThriftSystem {
  id: string;
  name: string;
  status: "pending" | "inactive" | "active";
  amount?: number;
  memberCount?: number;
  joinedAt?: string;
  createdAt?: string;
}

interface FilterState {
  statusFilter: string;
  sortOrder: string;
  showOnlyRecent: boolean;
  amountFilter: string;
  minMembers: number;
}

// Status badge component for consistent styling
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <span className={`ml-2 text-xs px-2 py-1 rounded border ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

// System list item component
const SystemListItem = ({ system, onView, onJoin }: { system: ThriftSystem; onView: (system: ThriftSystem) => void; onJoin: (system: ThriftSystem) => void; }) => {
  return (
    <div className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <span className="font-medium">{system.name}</span>
        <StatusBadge status={system.status} />
        {system.amount && (
          <span className="ml-2 text-xs bg-white px-2 py-1 rounded border">
            ₦{system.amount.toLocaleString()}
          </span>
        )}
        {system.memberCount && (
          <span className="ml-2 text-xs text-gray-600">
            {system.memberCount} members
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(system)}
          className="flex items-center gap-1"
        >
          <Eye size={14} />
          View
        </Button>
        <Button
          size="sm"
          variant={system.status === "active" ? "outline" : "default"}
          onClick={() => onJoin(system)}
          className="flex items-center gap-1"
          disabled={system.status === "active"}
        >
          <UserPlus size={14} />
          Join
        </Button>
      </div>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  // Search state with debounce implementation
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // System state management
  const [selectedSystem, setSelectedSystem] = useState<ThriftSystem | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ThriftSystem[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ThriftSystem[]>([]);
  
  // Filtered systems for featured section
  const [filteredFeaturedSystems, setFilteredFeaturedSystems] = useState<ThriftSystem[]>([]);

  // Auto-scrolling state
  const [isScrolling, setIsScrolling] = useState(true);
  const scrollRef = useRef(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // Filter states
  const [filterState, setFilterState] = useState({
    statusFilter: "all",
    sortOrder: "asc",
    showOnlyRecent: false,
    amountFilter: "all",
    minMembers: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  // For pagination as fallback to scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Implement search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update main search term for the query
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Fetch systems with proper filtering
  const { data: systems = [], refetch, isLoading, isError } = useQuery({
    queryKey: [
      "thriftSystems",
      searchTerm,
      filterState.statusFilter,
      filterState.sortOrder,
      filterState.showOnlyRecent,
      filterState.amountFilter,
      filterState.minMembers
    ],
    queryFn: async () => {
      try {
        let query = supabase
          .from("thrift_systems")
          .select("*");

        // Apply search filter if provided
        if (searchTerm) {
          query = query.ilike("name", `%${searchTerm}%`);
        }

        // Apply status filter if not "all"
        if (filterState.statusFilter !== "all") {
          query = query.eq("status", filterState.statusFilter);
        }

        // Apply amount filter if not "all"
        if (filterState.amountFilter !== "all") {
          // Parse the amount range based on selection
          if (filterState.amountFilter === "less100k") {
            query = query.lt("amount", 100000);
          } else if (filterState.amountFilter === "100k-500k") {
            query = query.gte("amount", 100000).lt("amount", 500000);
          } else if (filterState.amountFilter === "500k-1m") {
            query = query.gte("amount", 500000).lt("amount", 1000000);
          } else if (filterState.amountFilter === "above1m") {
            query = query.gte("amount", 1000000);
          }
        }

        // Apply minimum members filter
        if (filterState.minMembers > 0) {
          query = query.gte("memberCount", filterState.minMembers);
        }

        // Apply recent filter
        if (filterState.showOnlyRecent) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte("createdAt", thirtyDaysAgo.toISOString());
        }

        // Apply sorting
        query = query.order("name", { ascending: filterState.sortOrder === "asc" });

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
      } catch (error) {
        console.error("Error fetching thrift systems:", error);
        toast.error("Failed to load thrift systems");
        return [];
      }
    },
    keepPreviousData: true,
  });

  // Handle join request
  const handleJoin = useCallback(async (system: ThriftSystem) => {
    try {
      if (system.status === "active") {
        toast.error(`You're already a member of ${system.name}`);
        return;
      }

      // In a real app, you would make an API call here
      // For now, we'll just update the UI state
      if (system.status === "pending" || system.status === "inactive") {
        // Check if already in pending requests to avoid duplicates
        if (!pendingRequests.some(req => req.id === system.id)) {
          setPendingRequests(prev => [...prev, system]);
          toast.success(`Join request sent for ${system.name}`);
        } else {
          toast.info(`Already requested to join ${system.name}`);
        }
      }
    } catch (error) {
      console.error("Error joining system:", error);
      toast.error(`Failed to join ${system.name}`);
    }
  }, [pendingRequests]);

  // Update approved requests when systems change
  useEffect(() => {
    const approved = systems.filter((sys) => sys.status === "inactive" || sys.status === "active");
    setApprovedRequests(approved);
  }, [systems]);

  // Filter systems for featured section to exclude those in pending or approved lists
  useEffect(() => {
    // Get IDs of systems that are in pending requests or approved requests
    const pendingIds = pendingRequests.map(system => system.id);
    const approvedIds = approvedRequests.map(system => system.id);
    const excludedIds = [...pendingIds, ...approvedIds];
    
    // Filter out systems that are in either pending or approved lists
    const filtered = systems.filter(system => !excludedIds.includes(system.id));
    
    setFilteredFeaturedSystems(filtered);
  }, [systems, pendingRequests, approvedRequests]);

  // Auto-scrolling implementation with optimized rendering
  const startScrolling = useCallback(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPos = 0;
    const maxScroll = scrollContainer.scrollHeight / 2;
    const speed = 0.5; // Slower, smoother scrolling

    const scrollLoop = () => {
      if (!isScrolling || searchTerm.trim() !== "") {
        // Clean up and return if not scrolling
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
        }
        return;
      }

      scrollPos += speed;

      // Reset when reaching the halfway point
      if (scrollPos >= maxScroll) {
        scrollPos = 0;
      }

      scrollContainer.style.transform = `translateY(-${scrollPos}px)`;
      scrollAnimationRef.current = requestAnimationFrame(scrollLoop);
    };

    scrollLoop();

    // Clean up animation frame on unmount
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [isScrolling, searchTerm]);

  // Start or stop scrolling when isScrolling state changes
  useEffect(() => {
    if (isScrolling && searchTerm.trim() === "") {
      const cleanup = startScrolling();
      // Clean up when component unmounts
      return cleanup;
    }
  }, [isScrolling, searchTerm, startScrolling]);

  // Toggle scrolling when user clicks
  const handleToggleScrolling = useCallback(() => {
    setIsScrolling(prev => !prev);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterState({
      statusFilter: "all",
      sortOrder: "asc",
      showOnlyRecent: false,
      amountFilter: "all",
      minMembers: 0
    });
    setSearchInput("");
    setSearchTerm("");
  }, []);

  // Update a single filter without affecting others
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Toggle filters visibility
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || filterState.statusFilter !== "all" || filterState.amountFilter !== "all" || filterState.showOnlyRecent || filterState.minMembers > 0;

  // Calculate paginated items for the normal view
  const paginatedSystems = hasActiveFilters ? systems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : systems;

  // Calculate total pages for pagination
  const totalPages = Math.ceil(systems.length / itemsPerPage);

  // Page navigation
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Thrift Systems</h1>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Refresh"}
        </Button>
      </div>

      {/* Search and Collapsible Filter Section */}
      <div className="bg-gray-50 p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Search & Filters</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFilters}
            className="flex items-center gap-2"
          >
            <Filter size={14} />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>

        {/* Always visible search bar */}
        <div className="mb-4">
          <Label htmlFor="search" className="mb-2 block">Search</Label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Search thrift systems..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border p-2 w-full rounded"
            />
            {searchInput && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible filter section */}
        {showFilters && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Status Filter */}
              <div>
                <Label htmlFor="status" className="mb-2 block">Status</Label>
                <Select
                  value={filterState.statusFilter}
                  onValueChange={(value) => updateFilter("statusFilter", value)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Filter */}
              <div>
                <Label htmlFor="amount" className="mb-2 block">Amount Range</Label>
                <Select
                  value={filterState.amountFilter}
                  onValueChange={(value) => updateFilter("amountFilter", value)}
                >
                  <SelectTrigger id="amount" className="w-full">
                    <SelectValue placeholder="Filter by amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Amounts</SelectItem>
                    <SelectItem value="less100k">Less than ₦100,000</SelectItem>
                    <SelectItem value="100k-500k">₦100,000 - ₦500,000</SelectItem>
                    <SelectItem value="500k-1m">₦500,000 - ₦1,000,000</SelectItem>
                    <SelectItem value="above1m">Above ₦1,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <Label htmlFor="sort" className="mb-2 block">Sort By</Label>
                <Select
                  value={filterState.sortOrder}
                  onValueChange={(value) => updateFilter("sortOrder", value)}
                >
                  <SelectTrigger id="sort" className="w-full">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Name (A-Z)</SelectItem>
                    <SelectItem value="desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Members */}
              <div>
                <Label htmlFor="members" className="mb-2 block">Minimum Members</Label>
                <input
                  id="members"
                  type="number"
                  min="0"
                  value={filterState.minMembers}
                  onChange={(e) => updateFilter("minMembers", parseInt(e.target.value) || 0)}
                  className="border p-2 w-full rounded"
                />
              </div>

              {/* Recent Filter */}
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="recent"
                  checked={filterState.showOnlyRecent}
                  onCheckedChange={(checked) =>
                    updateFilter("showOnlyRecent", checked === true)
                  }
                />
                <Label htmlFor="recent">Show only recently added (last 30 days)</Label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => refetch()} className="flex items-center gap-1">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply Filters"}
              </Button>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center gap-1"
              >
                <X size={14} />
                Reset Filters
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
          <p>Failed to load thrift systems. Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-2">Retry</Button>
        </div>
      )}

      {/* Systems Display */}
      {!isLoading && !isError && (
        <>
          {/* Auto-Scrolling Systems (only if search is empty and no filters) */}
          {!hasActiveFilters ? (
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-semibold">Featured Thrift Systems</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleScrolling}
                  className="flex items-center gap-2"
                >
                  {isScrolling ? (
                    <>
                      <PauseCircle size={14} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={14} />
                      <span>Resume</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Auto-scrolling container */}
              <div
                className="relative h-64 overflow-hidden cursor-pointer"
                onClick={handleToggleScrolling}
              >
                {filteredFeaturedSystems.length > 0 ? (
                  <div ref={scrollRef} className="will-change-transform">
                    {/* First set of systems */}
                    {filteredFeaturedSystems.map((system) => (
                      <SystemListItem
                        key={`scroll-1-${system.id}`}
                        system={system}
                        onView={setSelectedSystem}
                        onJoin={handleJoin}
                      />
                    ))}
                    {/* Duplicate set for seamless scrolling */}
                    {filteredFeaturedSystems.map((system) => (
                      <SystemListItem
                        key={`scroll-2-${system.id}`}
                        system={system}
                        onView={setSelectedSystem}
                        onJoin={handleJoin}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No featured systems available</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Regular paginated list view for filtered results
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <h3 className="font-semibold">
                  Search Results
                  {systems.length > 0 && <span className="text-sm text-gray-500 ml-2">({systems.length} found)</span>}
                </h3>
              </div>

              <div className="divide-y">
                {systems.length > 0 ? (
                  <>
                    {paginatedSystems.map((system) => (
                      <SystemListItem
                        key={system.id}
                        system={system}
                        onView={setSelectedSystem}
                        onJoin={handleJoin}
                      />
                    ))}

                    {/* Pagination controls when there are enough items */}
                    {totalPages > 1 && (
                      <div className="p-3 flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No results match your filters</p>
                    <Button onClick={resetFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Requests */}
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <h3 className="font-semibold">Pending Requests</h3>
            </div>
            <div className="p-3">
              {pendingRequests.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2"
                    >
                      <span>{req.name}</span>
                      <StatusBadge status="pending" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => setSelectedSystem(req)}
                      >
                        <Eye size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pending requests</p>
              )}
            </div>
          </div>

          {/* Approved Requests */}
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <h3 className="font-semibold">My Thrift Systems</h3>
            </div>
            <div className="divide-y">
              {approvedRequests.length > 0 ? (
                approvedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                  >
                    <div>
                      <span className="font-medium">{req.name}</span>
                      <StatusBadge status={req.status} />
                      {req.amount && (
                        <span className="ml-2 text-xs bg-white px-2 py-1 rounded border">
                          ₦{req.amount.toLocaleString()}
                        </span>
                      )}
                      {req.memberCount && (
                        <span className="ml-2 text-xs text-gray-600">
                          {req.memberCount} members
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedSystem(req)}
                      className="flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View Details
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-500">No active thrift systems</p>
                  <p className="text-sm text-gray-400 mt-1">Join a system to see it here</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* View Details Modal */}
      {selectedSystem && (
        <Dialog open={!!selectedSystem} onOpenChange={(open) => !open && setSelectedSystem(null)}>
          <DialogTitle className="flex justify-between items-center">
            <span>{selectedSystem.name}</span>
            <StatusBadge status={selectedSystem.status} />
          </DialogTitle>
          <DialogContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSystem.amount && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-lg font-semibold">₦{selectedSystem.amount.toLocaleString()}</p>
                  </div>
                )}
                {selectedSystem.memberCount && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Members</p>
                    <p className="text-lg font-semibold">{selectedSystem.memberCount}</p>
                  </div>
                )}
                {selectedSystem.joinedAt && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="text-lg font-semibold">
                      {new Date(selectedSystem.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedSystem.createdAt && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-lg font-semibold">
                      {new Date(selectedSystem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-700">
                <h4 className="font-medium mb-1">System Rules and Information</h4>
                <p className="text-sm">
                  This thrift system requires monthly contributions. Payouts are made on a rotating basis.
                  Additional details about {selectedSystem.name} would be displayed here.
                </p>
              </div>
            </div>
          </DialogContent>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedSystem(null)}>Close</Button>
            {selectedSystem.status !== "active" && (
              <Button
                variant="default"
                onClick={() => {
                  handleJoin(selectedSystem);
                  setSelectedSystem(null);
                }}
                className="w-full sm:w-auto"
              >
                Request to Join
              </Button>
            )}
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};

export default ClientDashboard;