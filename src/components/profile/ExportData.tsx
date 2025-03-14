import { useState } from "react";
import { supabase } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface ExportDataProps {
  userId: string;
}

const ExportData: React.FC<ExportDataProps> = ({ userId }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Helper function to properly escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    
    // If the value contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Convert object to CSV row
  const objectToCSVRow = (obj: Record<string, any>, headers: string[]): string => {
    return headers.map(header => escapeCSV(obj[header])).join(',');
  };

  // Generate CSV from data
  const generateCSV = (data: Record<string, any>[], filename: string): void => {
    if (!data.length) {
      toast.error("No data to export.");
      return;
    }

    // Get all headers from the data
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const headerRow = headers.join(',');
    
    // Create CSV rows
    const csvRows = [
      headerRow,
      ...data.map(row => objectToCSVRow(row, headers))
    ];
    
    // Combine rows to create full CSV
    const csvContent = csvRows.join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProfile = async () => {
    setIsExporting(true);

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (!profile) {
        toast.error("Profile data not found.");
        return;
      }

      generateCSV([profile], "profile-export.csv");
      toast.success("Profile exported successfully!");
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPosts = async () => {
    setIsExporting(true);

    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", userId);

      if (error) throw error;
      if (!posts || posts.length === 0) {
        toast.error("No posts found to export.");
        return;
      }

      generateCSV(posts, "posts-export.csv");
      toast.success(`${posts.length} posts exported successfully!`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllData = async () => {
    setIsExporting(true);

    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        toast.error("Profile data not found.");
        return;
      }

      // Fetch posts
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", userId);

      if (postsError) throw postsError;

      // Export profile
      generateCSV([profile], "profile-export.csv");
      
      // Export posts if any exist
      if (posts && posts.length > 0) {
        generateCSV(posts, "posts-export.csv");
      }

      toast.success("All data exported successfully!");
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Data"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportProfile}>
          Export Profile Only
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPosts}>
          Export Posts Only
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAllData}>
          Export All Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportData;