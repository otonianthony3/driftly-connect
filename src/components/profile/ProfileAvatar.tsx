import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Camera, 
  Trash2, 
  Upload, 
  X, 
  ZoomIn, 
  History, 
  MoreHorizontal,
  Info,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop/types";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  userId: string;
  avatarUrl?: string;
  userName?: string;
  maxRetries?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  userId, 
  avatarUrl, 
  userName = "",
  maxRetries = 3
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "pending" | "success" | "error" | "retrying">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate initials for avatar fallback
  const getInitials = useCallback(() => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map(name => name[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }, [userName]);

  // Create a blob URL from a data URL
  const dataURLToBlob = (dataURL: string): Promise<Blob> => {
    return fetch(dataURL).then(res => res.blob());
  };

  // Handle crop complete
  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create a cropped image
  const createCroppedImage = useCallback(async () => {
    if (!currentFile || !croppedAreaPixels) return null;
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const image = new Image();
      
      image.src = croppedImageUrl!;
      
      return new Promise<Blob>((resolve) => {
        image.onload = () => {
          const { x, y, width, height } = croppedAreaPixels;
          canvas.width = width;
          canvas.height = height;
          
          ctx!.drawImage(
            image,
            x,
            y,
            width,
            height,
            0,
            0,
            width,
            height
          );
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            }
          }, currentFile.type);
        };
      });
    } catch (error) {
      console.error("Error creating cropped image:", error);
      return null;
    }
  }, [currentFile, croppedAreaPixels, croppedImageUrl]);

  // Process file before upload
  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Invalid file type (only JPEG, PNG, GIF allowed).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB.");
      return;
    }

    // Set current file for cropping
    setCurrentFile(file);
    
    // Create image preview for cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCroppedImageUrl(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Clean up retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Handle automatic retry
  const handleRetry = useCallback(async (manualRetry = false) => {
    if (!currentBlob || !currentFile) {
      setUploadStatus("idle");
      return;
    }

    // Reset if we've reached max retries and user hasn't manually triggered retry
    if (retryCount >= maxRetries && !manualRetry) {
      setUploadStatus("error");
      setShowRetryDialog(true);
      return;
    }

    // Update retry counter if not a manual retry
    if (!manualRetry) {
      setRetryCount(prev => prev + 1);
    }
    
    setUploadStatus("retrying");
    
    // Exponential backoff for retries (1s, 2s, 4s, etc.)
    const backoffTime = manualRetry ? 0 : Math.pow(2, retryCount) * 1000;
    
    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Set timeout for retry with backoff
    retryTimeoutRef.current = setTimeout(() => {
      handleFileUpload(currentBlob, true);
    }, backoffTime);
    
  }, [currentBlob, currentFile, retryCount, maxRetries]);

  // Handle file upload with retry capability
  const handleFileUpload = useCallback(async (blob: Blob, isRetry = false) => {
    if (!blob || !currentFile) return;
    
    // Save blob for potential retries
    if (!isRetry) {
      setCurrentBlob(blob);
      setRetryCount(0);
    }
    
    setUploadStatus("pending");

    try {
      const fileExt = currentFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Create a new File from the cropped Blob
      const croppedFile = new File([blob], `avatar.${fileExt}`, {
        type: currentFile.type
      });

      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error("Network connection unavailable. Please check your internet connection.");
      }

      // Upload to Supabase Storage with timeout
      const uploadPromise = supabase.storage
        .from("avatars")
        .upload(filePath, croppedFile, { upsert: true });
        
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Upload timed out. Server may be slow or unavailable.")), 15000);
      });
      
      // Race the upload against a timeout
      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;
      if (uploadError) throw uploadError;

      // Update database with new avatar URL
      const publicUrl = `${supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
        
      if (updateError) throw updateError;

      // Update preview & show success toast
      setPreviewUrl(publicUrl);
      toast.success(isRetry 
        ? `Avatar updated successfully after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'}`
        : "Avatar updated successfully");
      setUploadStatus("success");
      
      // Reset retry state
      setRetryCount(0);
      setCurrentBlob(null);
      setErrorDetails(null);
      setShowRetryDialog(false);
      
      // Clear current file and cropper state
      setShowCropper(false);
      setCurrentFile(null);
      setCroppedImageUrl(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorDetails(error.message || "Unknown error occurred");
      
      // Categorize errors to determine retry strategy
      const errorMessage = error.message || "";
      const isNetworkError = errorMessage.includes("network") || 
                             errorMessage.includes("internet") || 
                             errorMessage.includes("timeout") ||
                             !navigator.onLine;
      const isServerError = errorMessage.includes("500") || 
                           errorMessage.includes("503") || 
                           errorMessage.includes("unavailable") ||
                           errorMessage.includes("overloaded");
      const isTemporaryError = isNetworkError || isServerError;
      
      // Show appropriate error message
      if (isRetry) {
        if (retryCount < maxRetries) {
          toast.error(`Retry ${retryCount}/${maxRetries} failed. Attempting again...`);
          handleRetry();
        } else {
          toast.error(`Failed after ${maxRetries} retries. Please try manually.`);
          setUploadStatus("error");
          setShowRetryDialog(true);
        }
      } else if (isTemporaryError) {
        toast.error(`Upload failed: ${error.message}. Retrying automatically...`);
        handleRetry();
      } else {
        toast.error(`Upload failed: ${error.message}`);
        setUploadStatus("error");
        setShowRetryDialog(true);
      }
    }
  }, [userId, currentFile, retryCount, maxRetries, handleRetry]);

  // Handle avatar removal
  const handleRemoveAvatar = useCallback(async () => {
    if (!avatarUrl && !previewUrl) return;

    setUploadStatus("pending");
    
    try {
      // Update database to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);
        
      if (updateError) throw updateError;

      // Remove from storage if we have a URL
      if (previewUrl) {
        const avatarPath = previewUrl.split("/").slice(-2).join("/");
        if (avatarPath) {
          await supabase.storage.from("avatars").remove([avatarPath]);
        }
      }

      // Update state
      setPreviewUrl(null);
      toast.success("Avatar removed successfully");
      setUploadStatus("success");
    } catch (error: any) {
      toast.error(error.message);
      setUploadStatus("error");
    } finally {
      setUploadStatus("idle");
    }
  }, [userId, avatarUrl, previewUrl]);

  // Handle file change from input
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input value to allow re-selection of the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFile]);

  // Handle drop zone events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Set up and clean up drag and drop event listeners
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    
    if (dropZone) {
      dropZone.addEventListener("dragenter", handleDragEnter as unknown as EventListener);
      dropZone.addEventListener("dragleave", handleDragLeave as unknown as EventListener);
      dropZone.addEventListener("dragover", handleDragOver as unknown as EventListener);
      dropZone.addEventListener("drop", handleDrop as unknown as EventListener);
      
      return () => {
        dropZone.removeEventListener("dragenter", handleDragEnter as unknown as EventListener);
        dropZone.removeEventListener("dragleave", handleDragLeave as unknown as EventListener);
        dropZone.removeEventListener("dragover", handleDragOver as unknown as EventListener);
        dropZone.removeEventListener("drop", handleDrop as unknown as EventListener);
      };
    }
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  // Handle crop completion and upload
  const handleCropComplete = useCallback(async () => {
    const blob = await createCroppedImage();
    if (blob) {
      await handleFileUpload(blob);
    }
  }, [createCroppedImage, handleFileUpload]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div 
        ref={dropZoneRef}
        className={`relative ${isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      >
        <Avatar className="h-24 w-24 border-4 border-background">
          <AvatarImage src={previewUrl || avatarUrl} alt="User Avatar" />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>

        {(uploadStatus === "pending" || uploadStatus === "retrying") && (
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center rounded-full">
            <div className={cn(
              "animate-spin border-2 border-t-transparent rounded-full h-8 w-8 border-white",
              uploadStatus === "retrying" ? "border-amber-400" : "border-white"
            )} />
            {uploadStatus === "retrying" && (
              <span className="text-xs text-white mt-1 font-medium">Retry {retryCount}/{maxRetries}</span>
            )}
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
        )}

        <div className="absolute -bottom-2 right-0 flex space-x-2">
          <Label htmlFor="avatar" className="cursor-pointer">
            <div className="p-2 bg-primary text-primary-foreground rounded-full shadow hover:opacity-90 transition-opacity">
              <Camera className="h-4 w-4" />
            </div>
            <Input 
              id="avatar" 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadStatus === "pending" || uploadStatus === "retrying"}
            />
          </Label>
          
          {(previewUrl || avatarUrl) && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={uploadStatus === "pending" || uploadStatus === "retrying"}
              className="p-2 bg-destructive text-destructive-foreground rounded-full shadow hover:opacity-90 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Drag & drop or click to upload. JPEG, PNG or GIF, max 2MB
      </p>
      
      {/* Image Cropper Dialog */}
      <Dialog open={showCropper} onOpenChange={(open) => {
        if (!open) {
          setShowCropper(false);
          setCurrentFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Avatar</DialogTitle>
          </DialogHeader>
          
          <div className="h-64 relative">
            {croppedImageUrl && (
              <Cropper
                image={croppedImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <ZoomIn className="h-4 w-4" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCropper(false);
                setCurrentFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCropComplete}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Retry Dialog */}
      <Dialog 
        open={showRetryDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowRetryDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Failed</DialogTitle>
            <DialogDescription>
              The avatar upload encountered an error after {retryCount} {retryCount === 1 ? 'attempt' : 'attempts'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-destructive">Error details:</p>
              <p className="text-sm mt-1">{errorDetails || "Unknown error occurred"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm">Troubleshooting suggestions:</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Check your internet connection</li>
                <li>Try reducing the image size</li>
                <li>Make sure the image format is supported (JPEG, PNG, GIF)</li>
                <li>Try again in a few minutes</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              className="sm:w-auto w-full" 
              onClick={() => {
                setShowRetryDialog(false);
                setCurrentFile(null);
                setCurrentBlob(null);
                setRetryCount(0);
                setUploadStatus("idle");
              }}
            >
              Cancel
            </Button>
            <Button 
              className="sm:w-auto w-full"
              onClick={() => {
                setShowRetryDialog(false);
                handleRetry(true);
              }}
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileAvatar;