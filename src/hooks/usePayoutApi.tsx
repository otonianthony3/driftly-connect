import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Define types
interface Payout {
  id: string;
  reference: string;
  amount: number;
  status: string;
  date: string;
  recipient: {
    name: string;
    email: string;
    accountId?: string;
  };
  method: string;
  currency: string;
  notes?: string;
  metadata?: Record<string, any>;
}

interface PayoutsResponse {
  data: Payout[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface PayoutParams {
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Custom hook to handle payout-related API calls
 * @returns Object with payout API methods and state
 */
export const usePayoutApi = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // API base URL - could be moved to an environment variable or config file
  const API_BASE_URL = '/api/payouts';

  /**
   * Fetch payouts with optional filtering and sorting
   */
  const fetchPayouts = useCallback(async (params: PayoutParams = {}): Promise<PayoutsResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Format the date parameters
      const formattedParams: Record<string, any> = { ...params };
      
      if (params.startDate) {
        formattedParams.startDate = params.startDate.toISOString();
      }
      
      if (params.endDate) {
        formattedParams.endDate = params.endDate.toISOString();
      }

      const response = await axios.get(API_BASE_URL, { params: formattedParams });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch payouts. Please try again.';
      
      setError(errorMessage);
      toast.error('Failed to load payouts');
      
      // Return empty result on error
      return { data: [], totalCount: 0, page: 1, pageSize: 10 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a single payout by ID
   */
  const fetchPayoutById = useCallback(async (id: string): Promise<Payout | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : `Failed to fetch payout details for ID: ${id}`;
      
      setError(errorMessage);
      toast.error('Failed to load payout details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Bulk export payouts - triggers download of selected payouts
   */
  const bulkExportPayouts = useCallback(async (payoutIds: string[]): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/export`, 
        { payoutIds },
        { responseType: 'blob' }
      );

      // Create a download link and trigger download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = downloadUrl;
      link.download = `payouts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to export payouts';
      
      setError(errorMessage);
      toast.error('Failed to export payouts');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update payout status
   */
  const updatePayoutStatus = useCallback(async (
    id: string, 
    status: string
  ): Promise<Payout | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.patch(`${API_BASE_URL}/${id}`, { status });
      toast.success(`Payout status updated to ${status}`);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : `Failed to update payout status for ID: ${id}`;
      
      setError(errorMessage);
      toast.error('Failed to update payout status');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add notes to a payout
   */
  const addPayoutNotes = useCallback(async (
    id: string, 
    notes: string
  ): Promise<Payout | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.patch(`${API_BASE_URL}/${id}/notes`, { notes });
      toast.success('Notes added to payout');
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : `Failed to add notes to payout ID: ${id}`;
      
      setError(errorMessage);
      toast.error('Failed to add notes');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Retry a failed payout
   */
  const retryPayout = useCallback(async (id: string): Promise<Payout | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/${id}/retry`);
      toast.success('Payout retry initiated');
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : `Failed to retry payout ID: ${id}`;
      
      setError(errorMessage);
      toast.error('Failed to retry payout');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchPayouts,
    fetchPayoutById,
    bulkExportPayouts,
    updatePayoutStatus,
    addPayoutNotes,
    retryPayout,
    isLoading,
    error
  };
};

export default usePayoutApi;