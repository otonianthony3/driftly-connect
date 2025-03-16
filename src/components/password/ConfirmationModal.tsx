import { FC, useEffect, useRef } from "react";
import { AlertTriangle, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  className?: string;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  title = "Confirm Action",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  className,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus the modal when it opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onCancel]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={cn(
          "bg-white dark:bg-gray-800 rounded-lg shadow-xl",
          "w-full max-w-md p-6 mx-4",
          "transform transition-all duration-300 ease-out",
          "animate-in fade-in zoom-in-95",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {isDestructive ? (
              <div className="mr-3 flex-shrink-0 bg-red-100 rounded-full p-1">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            ) : (
              <div className="mr-3 flex-shrink-0 bg-blue-100 rounded-full p-1">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <h3 
              id="modal-title"
              className="text-lg font-medium text-gray-900 dark:text-white"
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {message || "Are you sure you want to update your password?"}
          </p>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "border border-gray-300 dark:border-gray-600",
              "text-gray-700 dark:text-gray-300",
              "bg-white dark:bg-gray-700",
              "hover:bg-gray-50 dark:hover:bg-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "transition-colors duration-200"
            )}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "focus:outline-none focus:ring-2",
              "transition-colors duration-200",
              isDestructive ? (
                "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
              ) : (
                "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white"
              )
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};