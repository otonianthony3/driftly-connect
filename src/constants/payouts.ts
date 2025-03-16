/**
 * Payout-related constants (Production Ready)
 *
 * These constants are frozen to ensure they remain immutable during runtime.
 */

// Commonly used payout status types
export const PAYOUT_STATUS_TYPES = Object.freeze({
    ALL: "all",
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
    PROCESSING: "processing",
  });
  
  // Fields used for sorting payouts
  export const SORT_FIELDS = Object.freeze({
    DATE: "date",
    AMOUNT: "amount",
    STATUS: "status",
    NAME: "name", // if needed
  });
  
  // Default number of items per page for pagination
  export const ITEMS_PER_PAGE = 10;