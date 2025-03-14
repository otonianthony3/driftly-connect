import { useState, useEffect, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, RefreshCw, Undo } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarCropperProps {
  file: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  minZoom?: number;
  maxZoom?: number;
}

const AvatarCropper: React.FC<AvatarCropperProps> = ({ 
  file, 
  onCropComplete, 
  onCancel,
  aspectRatio = 1,
  minZoom = 1,
  maxZoom = 3
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoHistory, setUndoHistory] = useState<Array<{crop: {x: number, y: number}, zoom: number, rotation: number}>>([]);
  
  // Keep a reference to the image URL for cleanup
  const imageUrlRef = useRef<string>("");

  // Create a URL for the image file
  useEffect(() => {
    try {
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      imageUrlRef.current = objectUrl;
      
      // Check if image loads properly
      const img = new Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => {
        setError("Failed to load image. The file might be corrupted.");
        setIsLoading(false);
      };
      img.src = objectUrl;
    } catch (err) {
      setError("Failed to process image file.");
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, [file]);

  // Save state to history before changes
  const saveToHistory = useCallback(() => {
    setUndoHistory(prev => [...prev, { crop, zoom, rotation }]);
  }, [crop, zoom, rotation]);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (undoHistory.length > 0) {
      const lastState = undoHistory[undoHistory.length - 1];
      setCrop(lastState.crop);
      setZoom(lastState.zoom);
      setRotation(lastState.rotation);
      setUndoHistory(prev => prev.slice(0, -1));
    }
  }, [undoHistory]);

  // Handle crop complete
  const onCropCompleteHandler = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Reset to initial state
  const handleReset = useCallback(() => {
    saveToHistory();
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, [saveToHistory]);

  // Rotate image
  const handleRotate = useCallback(() => {
    saveToHistory();
    setRotation(prev => (prev + 90) % 360);
  }, [saveToHistory]);

  // Apply the crop
  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      const image = new Image();
      image.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to load image for cropping"));
        image.src = imageUrl;
      });
      
      // Set proper canvas dimensions
      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;
      
      // Apply rotation if needed
      if (rotation > 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      // Draw the cropped image
      const { x, y } = croppedAreaPixels;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      
      if (rotation > 0) {
        ctx.restore();
      }
      
      // Get blob from canvas
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, file.type, 0.95);
      });
      
      if (!blob) throw new Error("Failed to create image blob");
      
      onCropComplete(blob);
    } catch (err) {
      console.error("Error applying crop:", err);
      setError("Failed to process the image. Please try again.");
    }
  }, [croppedAreaPixels, imageUrl, rotation, file.type, onCropComplete]);

  return (
    <Dialog open={true} onOpenChange={() => !isLoading && onCancel()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Crop Avatar</span>
            {undoHistory.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={handleUndo} 
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className={cn(
          "relative overflow-hidden rounded-lg",
          isLoading ? "bg-muted animate-pulse" : "",
          error ? "bg-destructive/10" : ""
        )}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="h-64 flex items-center justify-center p-4 text-center text-destructive">
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !error && (
            <div className="h-64 md:h-80">
              <Cropper 
                image={imageUrl} 
                crop={crop} 
                zoom={zoom} 
                rotation={rotation}
                aspect={aspectRatio} 
                onCropChange={setCrop} 
                onCropComplete={onCropCompleteHandler} 
                onZoomChange={setZoom} 
                cropShape="round"
                showGrid={true}
                minZoom={minZoom}
                maxZoom={maxZoom}
                objectFit="contain"
              />
            </div>
          )}
        </div>

        {!isLoading && !error && (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2">
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <Slider 
                value={[zoom]} 
                min={minZoom} 
                max={maxZoom} 
                step={0.1} 
                onValueChange={(value) => {
                  if (value[0] !== zoom) {
                    saveToHistory();
                    setZoom(value[0]);
                  }
                }} 
                className="flex-1"
              />
              <span className="w-8 text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={handleRotate} 
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={handleReset} 
                title="Reset"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleApplyCrop} 
            disabled={isLoading || !!error || !croppedAreaPixels}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropper;