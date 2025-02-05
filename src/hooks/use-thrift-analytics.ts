import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useThriftAnalytics = () => {
  return useQuery({
    queryKey: ['thrift-analytics'],
    queryFn: async () => {
      console.log("Fetching optimized analytics data from materialized view...");
      const { data, error } = await supabase
        .from('mv_thrift_analytics')
        .select('*');

      if (error) {
        console.error("Error fetching analytics:", error);
        throw error;
      }

      return data;
    },
    staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
    cacheTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};