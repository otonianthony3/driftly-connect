import { useState, useEffect } from "react";
import { supabase } from "@/types/supabase";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CardContent } from "@/components/ui/card";
import { Instagram, Twitter, Linkedin } from "lucide-react";
import debounce from "lodash/debounce";

interface ProfileFormProps {
  userId: string;
  fullName?: string;
  bio?: string;
  location?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedIn?: string;
  isPublic?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  userId, 
  fullName = "", 
  bio = "", 
  location = "", 
  socialTwitter = "",
  socialInstagram = "",
  socialLinkedIn = "",
  isPublic = true
}) => {
  const [formData, setFormData] = useState({
    fullName: fullName,
    bio: bio,
    location: location,
    socialTwitter: socialTwitter,
    socialInstagram: socialInstagram,
    socialLinkedIn: socialLinkedIn,
    isPublic: isPublic
  });
  
  const [initialFormData, setInitialFormData] = useState({...formData});
  const [isUpdating, setIsUpdating] = useState(false);
  const [fieldLoading, setFieldLoading] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Rich text bio state (simplified version)
  const [isBioFocused, setIsBioFocused] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasChanges(hasUnsavedChanges);
    
    // Add beforeunload event listener to warn about unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, initialFormData]);
  
  // Autosave functionality
  const autoSave = debounce(async (field: string, value: string | boolean) => {
    if (value === initialFormData[field as keyof typeof initialFormData]) return;
    
    setFieldLoading(prev => ({ ...prev, [field]: true }));
    
    try {
      const updateData: Record<string, any> = {};
      
      // Map form field names to database column names
      const fieldMapping: Record<string, string> = {
        fullName: "full_name",
        socialTwitter: "social_twitter",
        socialInstagram: "social_instagram",
        socialLinkedIn: "social_linkedin",
        isPublic: "is_public"
      };
      
      const dbField = fieldMapping[field] || field;
      updateData[dbField] = value;
      
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);
        
      if (error) throw error;
      
      // Update initialFormData to reflect saved state
      setInitialFormData(prev => ({ ...prev, [field]: value }));
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
    } catch (error: any) {
      toast.error(`Failed to save ${field}: ${error.message}`);
    } finally {
      setFieldLoading(prev => ({ ...prev, [field]: false }));
    }
  }, 1000);
  
  // Handle input change with autosave
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    autoSave(id, value);
  };
  
  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPublic: checked }));
    autoSave("isPublic", checked);
  };
  
  // Handle form submission (full save)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName.trim(),
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          social_twitter: formData.socialTwitter.trim(),
          social_instagram: formData.socialInstagram.trim(),
          social_linkedin: formData.socialLinkedIn.trim(),
          is_public: formData.isPublic
        })
        .eq("id", userId);

      if (error) throw error;

      setInitialFormData({...formData});
      setHasChanges(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle cancel/reset
  const handleReset = () => {
    setFormData({...initialFormData});
    setShowUnsavedDialog(false);
  };
  
  // Attempt to leave with unsaved changes
  const handleCancelClick = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      // Navigate away or close form (implementation depends on your app)
      toast.info("No changes to discard");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Privacy Control */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Profile Visibility</h4>
            <p className="text-sm text-muted-foreground">
              {formData.isPublic ? "Your profile is publicly visible" : "Your profile is private"}
            </p>
          </div>
          <Switch 
            checked={formData.isPublic} 
            onCheckedChange={handleSwitchChange}
            aria-label="Toggle profile visibility"
          />
        </div>
      
        <div className="relative">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={handleChange}
            maxLength={50}
            className={fieldLoading.fullName ? "pr-10 opacity-70" : ""}
          />
          {fieldLoading.fullName && (
            <div className="absolute right-3 top-9 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        <div className="relative">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs text-muted-foreground">
              {formData.bio.length}/250
            </span>
          </div>
          
          <div className="relative">
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={250}
              rows={4}
              className={`${fieldLoading.bio ? "pr-10 opacity-70" : ""} ${isBioFocused ? "border-primary" : ""}`}
              onFocus={() => setIsBioFocused(true)}
              onBlur={() => setIsBioFocused(false)}
            />
            {fieldLoading.bio && (
              <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          
          {/* Simple rich text toolbar (appears when focused) */}
          {isBioFocused && (
            <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
              <span>Format with: <code>**bold**</code> <code>*italic*</code> <code>[link](url)</code></span>
            </div>
          )}
        </div>

        <div className="relative">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={handleChange}
            maxLength={100}
            className={fieldLoading.location ? "pr-10 opacity-70" : ""}
          />
          {fieldLoading.location && (
            <div className="absolute right-3 top-9 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        <CardContent className="space-y-4 p-0">
          <h3 className="text-sm font-medium">Social Media</h3>
          
          <div className="relative">
            <div className="flex items-center space-x-2">
              <Twitter className="h-5 w-5 text-muted-foreground" />
              <Input
                id="socialTwitter"
                value={formData.socialTwitter}
                onChange={handleChange}
                placeholder="Twitter username"
                className={fieldLoading.socialTwitter ? "pr-10 opacity-70" : ""}
              />
            </div>
            {fieldLoading.socialTwitter && (
              <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-2">
              <Instagram className="h-5 w-5 text-muted-foreground" />
              <Input
                id="socialInstagram"
                value={formData.socialInstagram}
                onChange={handleChange}
                placeholder="Instagram username"
                className={fieldLoading.socialInstagram ? "pr-10 opacity-70" : ""}
              />
            </div>
            {fieldLoading.socialInstagram && (
              <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-2">
              <Linkedin className="h-5 w-5 text-muted-foreground" />
              <Input
                id="socialLinkedIn"
                value={formData.socialLinkedIn}
                onChange={handleChange}
                placeholder="LinkedIn username"
                className={fieldLoading.socialLinkedIn ? "pr-10 opacity-70" : ""}
              />
            </div>
            {fieldLoading.socialLinkedIn && (
              <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
        </CardContent>

        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={isUpdating || !hasChanges}
            className={isUpdating ? "opacity-70" : ""}
          >
            {isUpdating ? "Saving..." : "Save All Changes"}
            {isUpdating && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancelClick}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleReset}
            disabled={isUpdating || !hasChanges}
            className="ml-auto"
          >
            Reset
          </Button>
        </div>
      </form>
      
      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileForm;