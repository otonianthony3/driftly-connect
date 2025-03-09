import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Dialog, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Filter,
  X,
  Eye,
  UserPlus,
  PauseCircle,
  PlayCircle,
  Home,
  Shield,
  List,
  DollarSign,
  User,
  LogOut,
} from "lucide-react";

/* ----------------------------- Type Definitions ---------------------------- */
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

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string; // or whatever your column is called
}

/* ---------------------------- Helper Functions ----------------------------- */
const maskPhoneNumber = (phone: string): string => {
  // Example: 08012345678 -> 080****5678
  if (!phone || phone.length < 7) return phone;
  // Show first 3 digits, hide next 4, then show the rest
  return phone.slice(0, 3) + "****" + phone.slice(7);
};

/* ---------------------------- Status Badge --------------------------------- */
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

/* -------------------------- System List Item ------------------------------- */
const SystemListItem = ({
  system,
  onView,
  onJoin,
}: {
  system: ThriftSystem;
  onView: (system: ThriftSystem) => void;
  onJoin: (system: ThriftSystem) => void;
}) => {
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

/* -------------------------- Navigation Menu ------------------------------- */
const MenuSidebar = ({
  menuOpen,
  toggleMenu,
  userProfile,
}: {
  menuOpen: boolean;
  toggleMenu: () => void;
  userProfile: UserProfile | null;
}) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-gray-100 text-gray-900 shadow-lg transform ${
        menuOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 z-40`}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Menu</h2>
        <Button variant="ghost" size="sm" onClick={toggleMenu}>
          <X size={16} />
        </Button>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b flex flex-col items-center">
        {userProfile ? (
          <>
            <img
              src={userProfile.avatarUrl || "/default-avatar.png"}
              alt="Profile"
              className="rounded-full w-16 h-16 object-cover mb-2 border border-gray-300"
            />
            <p className="text-sm font-medium">{userProfile.name}</p>
            <p className="text-xs text-gray-500">
              {maskPhoneNumber(userProfile.phone)}
            </p>
          </>
        ) : (
          // If profile is still loading or user is not logged in:
          <div className="text-sm text-gray-600 italic">Loading profile...</div>
        )}
      </div>

      {/* Menu Items */}
      <div className="p-4">
        <ul className="space-y-4">
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2"
              onClick={toggleMenu}
            >
              <Home size={16} />
              Client Dashboard
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2"
              onClick={toggleMenu}
            >
              <UserPlus size={16} />
              Register
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2"
              onClick={toggleMenu}
            >
              <Shield size={16} />
              Admin Dashboard
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2"
              onClick={toggleMenu}
            >
              <List size={16} />
              Payout History
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2"
              onClick={toggleMenu}
            >
              <DollarSign size={16} />
              Payout Management
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2"
              onClick={toggleMenu}
            >
              <User size={16} />
              Profile
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full text-left flex items-center gap-2 text-red-600"
              onClick={toggleMenu}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
};

/* --------------------------- Filter Sidebar ------------------------------- */
const FilterSidebar = ({
  sidebarOpen,
  toggleSidebar,
  filterState,
  updateFilter,
  resetFilters,
  refetch,
  isLoading,
  searchInput,
  setSearchInput,
  setSearchTerm,
}: {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  filterState: FilterState;
  updateFilter: (key: keyof FilterState, value: any) => void;
  resetFilters: () => void;
  refetch: () => void;
  isLoading: boolean;
  searchInput: string;
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 z-50`}
    >
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={toggleSidebar}>
          <X size={16} />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="sidebar-search" className="mb-2 block">
            Search
          </Label>
          <div className="relative">
            <input
              id="sidebar-search"
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
        {/* Status Filter */}
        <div>
          <Label htmlFor="status" className="mb-2 block">
            Status
          </Label>
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
          <Label htmlFor="amount" className="mb-2 block">
            Amount Range
          </Label>
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
          <Label htmlFor="sort" className="mb-2 block">
            Sort By
          </Label>
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
          <Label htmlFor="members" className="mb-2 block">
            Minimum Members
          </Label>
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
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recent"
            checked={filterState.showOnlyRecent}
            onCheckedChange={(checked) => updateFilter("showOnlyRecent", checked === true)}
          />
          <Label htmlFor="recent">Show only recently added (last 30 days)</Label>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={refetch} className="flex items-center gap-1">
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply Filters"}
          </Button>
          <Button variant="outline" onClick={resetFilters} className="flex items-center gap-1">
            <X size={14} />
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------- Main Client Dashboard -------------------------- */
const ClientDashboard: React.FC = () => {
  // -------------------- 1) Fetch the user session -------------------------
  const { data: sessionData } = useQuery({
    queryKey: ["userSession"],
    queryFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  // -------------------- 2) Fetch user profile from Supabase ---------------
  const userId = sessionData?.user?.id || null;
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;
      // Adjust "profiles" and column names as per your schema
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, phone, avatarUrl")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId, // Only run this query if userId is not null
  });

  // -------------------- 3) Search and filter states -----------------------
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [filterState, setFilterState] = useState<FilterState>({
    statusFilter: "all",
    sortOrder: "asc",
    showOnlyRecent: false,
    amountFilter: "all",
    minMembers: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // -------------------- 4) Thrift Systems Data ----------------------------
  const {
    data: systems = [],
    refetch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "thriftSystems",
      searchTerm,
      filterState.statusFilter,
      filterState.sortOrder,
      filterState.showOnlyRecent,
      filterState.amountFilter,
      filterState.minMembers,
    ],
    queryFn: async () => {
      try {
        let query = supabase.from("thrift_systems").select("*");
        if (searchTerm) {
          query = query.ilike("name", `%${searchTerm}%`);
        }
        if (filterState.statusFilter !== "all") {
          query = query.eq("status", filterState.statusFilter);
        }
        if (filterState.amountFilter !== "all") {
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
        if (filterState.minMembers > 0) {
          query = query.gte("memberCount", filterState.minMembers);
        }
        if (filterState.showOnlyRecent) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte("createdAt", thirtyDaysAgo.toISOString());
        }
        query = query.order("name", {
          ascending: filterState.sortOrder === "asc",
        });

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

  // -------------------- 5) Pending & Approved Requests --------------------
  const [pendingRequests, setPendingRequests] = useState<ThriftSystem[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ThriftSystem[]>([]);
  const [filteredFeaturedSystems, setFilteredFeaturedSystems] = useState<ThriftSystem[]>([]);

  const handleJoin = useCallback(
    async (system: ThriftSystem) => {
      try {
        if (system.status === "active") {
          toast.error(`You're already a member of ${system.name}`);
          return;
        }
        if (system.status === "pending" || system.status === "inactive") {
          if (!pendingRequests.some((req) => req.id === system.id)) {
            setPendingRequests((prev) => [...prev, system]);
            toast.success(`Join request sent for ${system.name}`);
          } else {
            toast.info(`Already requested to join ${system.name}`);
          }
        }
      } catch (error) {
        console.error("Error joining system:", error);
        toast.error(`Failed to join ${system.name}`);
      }
    },
    [pendingRequests]
  );

  useEffect(() => {
    const approved = systems.filter((sys) => sys.status === "inactive" || sys.status === "active");
    setApprovedRequests(approved);
  }, [systems]);

  useEffect(() => {
    const pendingIds = pendingRequests.map((system) => system.id);
    const approvedIds = approvedRequests.map((system) => system.id);
    const excludedIds = [...pendingIds, ...approvedIds];
    const filtered = systems.filter((system) => !excludedIds.includes(system.id));
    setFilteredFeaturedSystems(filtered);
  }, [systems, pendingRequests, approvedRequests]);

  // -------------------- 6) Auto-Scrolling Featured Systems -----------------
  const [isScrolling, setIsScrolling] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  const startScrolling = useCallback(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPos = 0;
    const maxScroll = scrollContainer.scrollHeight / 2;
    const speed = 0.5;

    const scrollLoop = () => {
      if (!isScrolling || searchTerm.trim() !== "") {
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
        }
        return;
      }
      scrollPos += speed;
      if (scrollPos >= maxScroll) {
        scrollPos = 0;
      }
      scrollContainer.style.transform = `translateY(-${scrollPos}px)`;
      scrollAnimationRef.current = requestAnimationFrame(scrollLoop);
    };

    scrollLoop();
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [isScrolling, searchTerm]);

  useEffect(() => {
    if (isScrolling && searchTerm.trim() === "") {
      const cleanup = startScrolling();
      return cleanup;
    }
  }, [isScrolling, searchTerm, startScrolling]);

  const handleToggleScrolling = useCallback(() => {
    setIsScrolling((prev) => !prev);
  }, []);

  // -------------------- 7) Pagination --------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasActiveFilters =
    searchTerm !== "" ||
    filterState.statusFilter !== "all" ||
    filterState.amountFilter !== "all" ||
    filterState.showOnlyRecent ||
    filterState.minMembers > 0;

  const paginatedSystems = hasActiveFilters
    ? systems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : systems;

  const totalPages = Math.ceil(systems.length / itemsPerPage);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  // -------------------- 8) Filter & Sidebar Toggles ------------------------
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const toggleFilterSidebar = useCallback(() => {
    setFilterSidebarOpen((prev) => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState({
      statusFilter: "all",
      sortOrder: "asc",
      showOnlyRecent: false,
      amountFilter: "all",
      minMembers: 0,
    });
    setSearchInput("");
    setSearchTerm("");
  }, []);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // -------------------- 9) View Details Modal -----------------------------
  const [selectedSystem, setSelectedSystem] = useState<ThriftSystem | null>(null);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Navigation Menu Toggle Button (Top Left) */}
      <Button variant="ghost" onClick={toggleMenu} className="fixed top-4 left-4 z-50">
        {/* Replace X with a "hamburger" icon if desired */}
        <X size={16} />
        <span className="ml-2">Menu</span>
      </Button>

      {/* Filter Sidebar Toggle Button (Top Right) */}
      <Button variant="ghost" onClick={toggleFilterSidebar} className="fixed top-4 right-4 z-50">
        <Filter size={16} />
        <span className="ml-2">Filters</span>
      </Button>

      {/* Navigation Menu Sidebar (with userProfile) */}
      <MenuSidebar menuOpen={menuOpen} toggleMenu={toggleMenu} userProfile={userProfile || null} />

      {/* Filter Sidebar */}
      <FilterSidebar
        sidebarOpen={filterSidebarOpen}
        toggleSidebar={toggleFilterSidebar}
        filterState={filterState}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        refetch={refetch}
        isLoading={isLoading}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setSearchTerm={setSearchTerm}
      />

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Thrift Systems</h1>
        <Button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Refresh"}
        </Button>
      </div>

      {/* Systems Display */}
      {!isLoading && !isError && (
        <>
          {/* Auto-Scrolling Systems (only if no filters/search) */}
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
              <div
                className="relative h-64 overflow-hidden cursor-pointer"
                onClick={handleToggleScrolling}
              >
                {filteredFeaturedSystems.length > 0 ? (
                  <div ref={scrollRef} className="will-change-transform">
                    {filteredFeaturedSystems.map((system) => (
                      <SystemListItem
                        key={`scroll-1-${system.id}`}
                        system={system}
                        onView={setSelectedSystem}
                        onJoin={handleJoin}
                      />
                    ))}
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
                  {systems.length > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({systems.length} found)
                    </span>
                  )}
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
                  <p className="text-sm text-gray-400 mt-1">
                    Join a system to see it here
                  </p>
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
                    <p className="text-lg font-semibold">
                      ₦{selectedSystem.amount.toLocaleString()}
                    </p>
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
                  This thrift system requires monthly contributions. Payouts are made on a rotating
                  basis. Additional details about {selectedSystem.name} would be displayed here.
                </p>
              </div>
            </div>
          </DialogContent>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedSystem(null)}>
              Close
            </Button>
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