import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/types/supabase";
import { toast } from "sonner";
import { Camera, Trash2, Upload, Undo, Camera as CameraIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AvatarCropper from "./AvatarCropper";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  userId: string;
  avatarUrl?: string;
  userName?: string;
  onUploadSuccess: (newUrl: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  userId, 
  avatarUrl, 
  userName = "", 
  onUploadSuccess,
  size = "lg",
  className
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(avatarUrl || null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Size mappings
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };

  const buttonSizeClasses = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
    xl: "h-10 w-10"
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
    xl: "h-5 w-5"
  };

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Handle file processing before cropping
  const processFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB.");
      return;
    }
    setCurrentFile(file);
    setShowCropper(true);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }, []);

  // Handle avatar upload completion
  const handleUploadComplete = async (blob: Blob) => {
    setUploadStatus("pending");

    try {
      const fileExt = currentFile!.name.split(".").pop();
      const timestamp = new Date().getTime();
      const filePath = `${userId}/avatar-${timestamp}.${fileExt}`;
      const newFile = new File([blob], `avatar-${timestamp}.${fileExt}`, { type: currentFile!.type });

      // Create an object URL for immediate preview
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);

      const { error } = await supabase.storage.from("avatars").upload(filePath, newFile, { upsert: true });
      if (error) throw error;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
      
      // Update the profile in the database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
        
      if (updateError) throw updateError;

      // Release the object URL and use the public URL instead
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(publicUrl);
      setUploadStatus("success");
      toast.success("Avatar updated successfully!");
      onUploadSuccess(publicUrl);
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
      setUploadStatus("error");
    } finally {
      setUploadStatus("idle");
      setShowCropper(false);
      setCurrentFile(null);
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    if (confirm("Are you sure you want to remove your avatar?")) {
      setUploadStatus("pending");
      try {
        // Store the current URL before removing it
        setOriginalUrl(previewUrl);
        
        // Update profile with null avatar_url
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: null })
          .eq("id", userId);
          
        if (error) throw error;
        
        setPreviewUrl(null);
        toast.success("Avatar removed successfully!");
        onUploadSuccess("");
      } catch (error: any) {
        toast.error(`Failed to remove avatar: ${error.message}`);
      } finally {
        setUploadStatus("idle");
      }
    }
  };

  // Handle undoing avatar removal
  const handleUndoRemove = async () => {
    if (!originalUrl) return;
    
    setUploadStatus("pending");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: originalUrl })
        .eq("id", userId);
        
      if (error) throw error;
      
      setPreviewUrl(originalUrl);
      toast.success("Avatar restored!");
      onUploadSuccess(originalUrl);
    } catch (error: any) {
      toast.error(`Failed to restore avatar: ${error.message}`);
    } finally {
      setUploadStatus("idle");
    }
  };

  // Effect to cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div 
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative group transition-all duration-300 cursor-pointer",
          isDragging ? "scale-110" : ""
        )}
      >
        <Avatar className={cn(
          sizeClasses[size],
          "border-4 border-background transition-all duration-300",
          isDragging ? "ring-4 ring-primary ring-opacity-50" : "",
          uploadStatus === "pending" ? "opacity-70" : ""
        )}>
          <AvatarImage src={previewUrl || undefined} alt={`${userName || 'User'}'s Avatar`} />
          <AvatarFallback className="bg-primary/10 text-primary-foreground">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>

        {/* Drag indicator overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-primary/20 backdrop-blur-sm">
            <Upload className="text-background h-8 w-8" />
          </div>
        )}

        {/* Loading indicator */}
        {uploadStatus === "pending" && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full backdrop-blur-sm">
            <div className="animate-spin border-2 border-t-transparent rounded-full h-8 w-8 border-white" />
          </div>
        )}

        {/* Button group */}
        <div className="absolute -bottom-2 right-0 flex space-x-1">
          <Button 
            size="icon"
            variant="secondary"
            className={buttonSizeClasses[size]}
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploadStatus === "pending"}
            title="Upload new avatar"
          >
            <CameraIcon className={iconSizeClasses[size]} />
          </Button>

          {previewUrl && (
            <Button 
              size="icon"
              variant="destructive"
              className={buttonSizeClasses[size]} 
              onClick={handleRemoveAvatar} 
              disabled={uploadStatus === "pending"}
              title="Remove avatar"
            >
              <Trash2 className={iconSizeClasses[size]} />
            </Button>
          )}

          {!previewUrl && originalUrl && (
            <Button 
              size="icon"
              variant="outline"
              className={buttonSizeClasses[size]} 
              onClick={handleUndoRemove} 
              disabled={uploadStatus === "pending"}
              title="Restore previous avatar"
            >
              <Undo className={iconSizeClasses[size]} />
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <Input 
        id="avatar" 
        ref={fileInputRef} 
        type="file" 
        accept="image/jpeg,image/png,image/gif,image/webp" 
        className="sr-only" 
        onChange={handleFileChange} 
      />

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-1">
        {isDragging ? "Drop to upload" : "Click or drag & drop to change"}
      </p>

      {/* Cropper modal */}
      {showCropper && currentFile && (
        <AvatarCropper 
          file={currentFile} 
          onCropComplete={handleUploadComplete} 
          onCancel={() => {
            setShowCropper(false);
            setCurrentFile(null);
          }} 
        />
      )}
    </div>
  );
};

export default AvatarUpload;