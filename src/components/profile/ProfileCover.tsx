import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Grid, Crop } from "lucide-react";
import { toast } from "sonner";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Default cover images
const DEFAULT_COVERS = [
  "/covers/default-1.jpg",
  "/covers/default-2.jpg",
  "/covers/default-3.jpg",
  "/covers/abstract-1.jpg",
  "/covers/nature-1.jpg",
  "/covers/city-1.jpg",
];

interface ProfileCoverProps {
  userId: string;
  coverImageUrl?: string;
}

const ProfileCover: React.FC<ProfileCoverProps> = ({ userId, coverImageUrl }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(coverImageUrl || null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [previousUploads, setPreviousUploads] = useState<string[]>([]);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Fetch user's previous uploads
  useEffect(() => {
    const fetchPreviousUploads = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("covers")
          .list(`${userId}`, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) throw error;

        // Get public URLs for all previous uploads
        const urls = data
          .filter(file => file.name !== 'cover.jpg' && file.name !== 'cover.png')
          .map(file => supabase.storage.from("covers").getPublicUrl(`${userId}/${file.name}`).data.publicUrl);

        setPreviousUploads(urls);
      } catch (error) {
        console.error("Error fetching previous uploads:", error);
      }
    };

    if (showDialog && activeTab === "gallery" && userId) {
      fetchPreviousUploads();
    }
  }, [userId, showDialog, activeTab]);

  // Set up drag and drop handlers
  useEffect(() => {
    const dropzone = dropzoneRef.current;
    if (!dropzone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("bg-primary/10", "border-primary");
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("bg-primary/10", "border-primary");
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("bg-primary/10", "border-primary");
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    };

    dropzone.addEventListener("dragover", handleDragOver);
    dropzone.addEventListener("dragleave", handleDragLeave);
    dropzone.addEventListener("drop", handleDrop);

    return () => {
      dropzone.removeEventListener("dragover", handleDragOver);
      dropzone.removeEventListener("dragleave", handleDragLeave);
      dropzone.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Handle file validation and prepare for upload
  const handleFileUpload = useCallback((file: File) => {
    if (!file) return;

    // Validate file type and size
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPEG and PNG images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover image must be less than 5MB.");
      return;
    }

    // Create a URL for the image to be cropped
    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setActiveTab("crop");
  }, []);

  // Handle cover image selection from file input
  const handleCoverChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileUpload(file);
  }, [handleFileUpload]);

  // Complete the upload after cropping
  const completeCropAndUpload = useCallback(async () => {
    if (!imageRef.current || !imageToCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setUploadStatus("pending");
      setShowDialog(false);

      try {
        const file = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const filePath = `${userId}/cover.jpg`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Also save a copy in the history
        const historyPath = `${userId}/cover-${Date.now()}.jpg`;
        await supabase.storage.from("covers").upload(historyPath, file);

        // Get public URL
        const publicUrl = supabase.storage.from("covers").getPublicUrl(filePath).data.publicUrl;

        // Update profile with new cover image
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ cover_image_url: publicUrl })
          .eq("id", userId);

        if (updateError) throw updateError;

        setPreviewUrl(publicUrl);
        toast.success("Cover image updated successfully");
        setUploadStatus("success");
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      } catch (error: any) {
        toast.error(error.message);
        setUploadStatus("error");
      } finally {
        setUploadStatus("idle");
      }
    }, 'image/jpeg');
  }, [imageToCrop, crop, userId]);

  // Select default cover image
  const selectDefaultCover = useCallback(async (coverUrl: string) => {
    setUploadStatus("pending");
    setShowDialog(false);

    try {
      // Update profile with default cover image
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_image_url: coverUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPreviewUrl(coverUrl);
      toast.success("Cover image updated successfully");
      setUploadStatus("success");
    } catch (error: any) {
      toast.error(error.message);
      setUploadStatus("error");
    } finally {
      setUploadStatus("idle");
    }
  }, [userId]);

  // Select image from gallery
  const selectGalleryImage = useCallback(async (imageUrl: string) => {
    setUploadStatus("pending");
    setShowDialog(false);

    try {
      // Update profile with gallery image
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_image_url: imageUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPreviewUrl(imageUrl);
      toast.success("Cover image updated successfully");
      setUploadStatus("success");
    } catch (error: any) {
      toast.error(error.message);
      setUploadStatus("error");
    } finally {
      setUploadStatus("idle");
    }
  }, [userId]);

  // Remove cover image
  const removeCoverImage = useCallback(async () => {
    setUploadStatus("pending");

    try {
      // Update profile to remove cover image
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_image_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      toast.success("Cover image removed");
      setUploadStatus("success");
    } catch (error: any) {
      toast.error(error.message);
      setUploadStatus("error");
    } finally {
      setUploadStatus("idle");
    }
  }, [userId]);

  // Responsive height based on screen size
  const getCoverHeight = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 'h-32' : 
             window.innerWidth < 1024 ? 'h-40' : 'h-48';
    }
    return 'h-48';
  };

  return (
    <>
      <div 
        ref={dropzoneRef}
        className={`relative w-full bg-muted overflow-hidden ${getCoverHeight()} 
                   transition-all duration-300 border-2 border-transparent`}
      >
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Cover Image" 
            className="w-full h-full object-cover"
          />
        )}

        {uploadStatus === "pending" && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="animate-spin border-2 border-t-transparent rounded-full h-8 w-8 border-white" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all group flex items-center justify-center opacity-0 hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              setShowDialog(true);
              setActiveTab("upload");
            }}
          >
            Change Cover
          </Button>
        </div>

        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow bg-white hover:bg-gray-100 text-gray-800"
            onClick={() => {
              setShowDialog(true);
              setActiveTab("upload");
            }}
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          {previewUrl && (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow bg-white hover:bg-gray-100 text-gray-800"
              onClick={removeCoverImage}
              disabled={uploadStatus === "pending"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Cover Image Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Update Cover Image</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="default">Default Covers</TabsTrigger>
              <TabsTrigger value="gallery">Your Gallery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="p-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary cursor-pointer transition-colors"
                onClick={() => document.getElementById("coverImageUpload")?.click()}
              >
                <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Click or drag an image here to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG or PNG, max 5MB</p>
                <Input
                  id="coverImageUpload"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={handleCoverChange}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="crop" className="p-4">
              {imageToCrop && (
                <div className="flex flex-col items-center gap-4">
                  <ReactCrop 
                    crop={crop} 
                    onChange={c => setCrop(c)}
                    aspect={3/1}
                  >
                    <img 
                      ref={imageRef}
                      src={imageToCrop} 
                      alt="Crop preview" 
                      className="max-h-80 object-contain"
                    />
                  </ReactCrop>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      URL.revokeObjectURL(imageToCrop);
                      setImageToCrop(null);
                      setActiveTab("upload");
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={completeCropAndUpload}>
                      Apply and Upload
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="default" className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DEFAULT_COVERS.map((cover, index) => (
                  <div 
                    key={index}
                    className="aspect-video rounded-md overflow-hidden border hover:border-primary cursor-pointer transition-all"
                    onClick={() => selectDefaultCover(cover)}
                  >
                    <img src={cover} alt={`Default cover ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="gallery" className="p-4">
              {previousUploads.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previousUploads.map((image, index) => (
                    <div 
                      key={index}
                      className="aspect-video rounded-md overflow-hidden border hover:border-primary cursor-pointer transition-all"
                      onClick={() => selectGalleryImage(image)}
                    >
                      <img src={image} alt={`Previous upload ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Grid className="mx-auto h-12 w-12 mb-2" />
                  <p>No previous uploads found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileCover;