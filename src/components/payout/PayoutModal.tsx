import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Calendar, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Building 
} from "lucide-react";

// Define a minimal interface for a payout object.
// Adjust the fields to match your data.
interface Payout {
  id: string;
  amount: number;
  status?: string;
  thrift_systems?: {
    name?: string;
  };
  scheduled_date?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  error?: string;
}

// Define the props for the PayoutModal component.
interface PayoutModalProps {
  payout?: Payout;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (payout: Payout) => void;
}

const PayoutModal: React.FC<PayoutModalProps> = ({ payout, isOpen, onClose, onDownload }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Simulate loading data (replace with real data fetching in production)
    if (payout) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [payout]);

  useEffect(() => {
    // Reset states when modal opens/closes
    if (isOpen) {
      setLoading(true);
      setError(null);
      setCopied(false);
      // Simulate potential errors (replace in production)
      if (payout && payout.error) {
        setError("Could not retrieve complete payout information.");
        setLoading(false);
      }
    }
  }, [isOpen, payout]);

  const handleCopyId = () => {
    if (payout?.transaction_id) {
      navigator.clipboard.writeText(payout.transaction_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const getStatusBadge = () => {
    if (!payout) return null;

    const status = payout.status?.toLowerCase() || "pending";

    const statusConfig: Record<string, { color: string; icon: JSX.Element | null }> = {
      completed: { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4 mr-1" /> },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: null },
      failed: { color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-4 h-4 mr-1" /> },
      processing: { color: "bg-blue-100 text-blue-800", icon: null },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="outline" className={`${config.color} flex items-center px-2 py-1 capitalize`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Payout Details</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : payout && !error ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-xl font-bold">{formatCurrency(payout.amount)}</span>
              </div>
              {getStatusBadge()}
            </div>
            <Card className="p-4 bg-gray-50">
              <div className="grid gap-3">
                <div className="flex items-start">
                  <Building className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Thrift System</p>
                    <p className="font-medium">{payout.thrift_systems?.name || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className="font-medium">{formatDate(payout.scheduled_date || "")}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{payout.payment_method || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Copy className="w-4 h-4 mr-2 text-gray-500" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <div className="flex items-center">
                      <p className="font-medium font-mono truncate max-w-xs">
                        {payout.transaction_id || "N/A"}
                      </p>
                      {payout.transaction_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1"
                          onClick={handleCopyId}
                          title="Copy transaction ID"
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {payout.notes && (
                  <div className="flex items-start">
                    <FileText className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium">{payout.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No payout information available</p>
          </div>
        )}
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {payout && !loading && !error && onDownload && (
            <Button onClick={() => onDownload(payout)} className="ml-2">
              Download Receipt
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutModal;