import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  RefreshCw,
  FileDown,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PayoutPaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void; // Parent-provided function to change page
  totalItems: number;
  itemsPerPage: number;
  hasMore?: boolean;
  setPageSize?: (newSize: number) => void;
  className?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: string) => void;
  availablePageSizes?: number[];
  showPageSizeSelector?: boolean;
  showQuickJump?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  exportFormats?: string[];
}

const PayoutPagination: React.FC<PayoutPaginationProps> = ({
  currentPage,
  onPageChange,
  totalItems,
  itemsPerPage,
  hasMore = false,
  setPageSize = undefined,
  className = "",
  isLoading = false,
  onRefresh = undefined,
  onExport = undefined,
  availablePageSizes = [5, 10, 25, 50, 100],
  showPageSizeSelector = true,
  showQuickJump = true,
  showExport = true,
  showRefresh = true,
  exportFormats = ["CSV", "PDF", "Excel"],
}) => {
  // Compute total pages internally
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate the visible page numbers (up to 5 at once)
  const getPageNumbers = (): number[] => {
    const pageNumbers: number[] = [];
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // Navigate to a given page number using the onPageChange prop
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Calculate results info: "Showing X to Y of Z results"
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

  // Quick jump state
  const [jumpToPage, setJumpToPage] = useState("");

  // Handle quick jump on Enter key press
  const handleQuickJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(jumpToPage, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        goToPage(page);
        setJumpToPage("");
      }
    }
  };

  // Handle change of itemsPerPage (if parent provides setPageSize)
  const handlePageSizeChange = (newSize: string) => {
    if (setPageSize) {
      setPageSize(parseInt(newSize, 10));
      onPageChange(1); // Reset to page 1 when page size changes
    }
  };

  // Handle export (if onExport is provided)
  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format.toLowerCase());
    }
  };

  return (
    <div className={`flex flex-col gap-4 mt-6 ${className}`}>
      {/* Top Controls: Results info and page size selector */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap items-center gap-4">
          {totalItems > 0 && (
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{startItem}</span> to{" "}
              <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </div>
          )}
          {showPageSizeSelector && setPageSize && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {availablePageSizes.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Action Buttons: Quick jump, refresh, export */}
        <div className="flex items-center gap-2">
          {showQuickJump && totalPages > 5 && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 hidden sm:inline">Go to:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyDown={handleQuickJump}
                className="h-8 w-16 px-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Page"
              />
            </div>
          )}
          {showRefresh && onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onRefresh}
                    disabled={isLoading}
                    aria-label="Refresh data"
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {showExport && onExport && (
            <div className="relative group">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      aria-label="Export data"
                    >
                      <FileDown size={16} className="mr-1" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="absolute z-10 right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block">
                {exportFormats.map((format) => (
                  <button
                    key={format}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleExport(format)}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Pagination Controls */}
      <div className="flex justify-center md:justify-between items-center">
        <div className="hidden md:block">
          &nbsp; {/* Spacer for desktop */}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => goToPage(1)}
            aria-label="First page"
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} className="mr-0 md:mr-1" />
            <span className="hidden md:inline">Previous</span>
          </Button>
          <div className="hidden md:flex mx-1">
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 mx-0.5"
                onClick={() => goToPage(page)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            ))}
          </div>
          <div className="flex md:hidden items-center mx-2">
            <span className="text-sm font-medium">
              Page {currentPage} {totalPages > 0 && `of ${totalPages}`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!hasMore && currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight size={16} className="ml-0 md:ml-1" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex h-8 w-8"
            disabled={!hasMore && currentPage >= totalPages}
            onClick={() => goToPage(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PayoutPagination;