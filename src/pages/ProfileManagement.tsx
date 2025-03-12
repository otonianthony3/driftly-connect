import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AccountManagement from "@/components/AccountManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types and Initial State
interface FormState {
  fullName: string;
  isDirty: boolean;
  errors: Record<string, string>;
}

type FormAction =
  | { type: "SET_FIELD"; field: string; value: string; validate?: (value: string) => string }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "RESET"; payload?: Partial<FormState> };

const initialFormState: FormState = {
  fullName: "",
  isDirty: false,
  errors: {}
};

// Custom Hook: useAuth
const useAuth = () => {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user ?? null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

// Custom Hook: useAvatarHandler
const useAvatarHandler = (userId: string) => {
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutateAsync: uploadAvatar, status: uploadStatus } = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Validate file
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Unsupported file type (JPEG/PNG/GIF only)");
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size exceeds 2MB limit");
      }
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: filePath })
        .eq("id", userId);
      
      if (updateError) throw updateError;
      return filePath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Avatar updated successfully");
    },
  });

  const handleFileChange = useCallback(async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      await uploadAvatar(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }, [uploadAvatar]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return {
    previewUrl,
    uploadStatus,
    handleFileChange,
  };
};

// Form Reducer
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        isDirty: true,
        errors: {
          ...state.errors,
          [action.field]: action.validate?.(action.value) || ""
        }
      };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "RESET":
      return { ...initialFormState, ...action.payload };
    default:
      return state;
  }
};

// Main Component
const ProfileManagement = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading: authLoading } = useAuth();
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  // Avatar Handling
  const { previewUrl, uploadStatus, handleFileChange } = useAvatarHandler(user?.id ?? "");
  
  // Profile Query
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    onSuccess: (data) => {
      dispatch({ type: "RESET", payload: { fullName: data?.full_name || "" } });
    }
  });

  // Update Profile Mutation
  const updateProfile = useMutation({
    mutationFn: async (fullName: string) => {
      const lastUpdate = localStorage.getItem("lastProfileUpdate");
      if (lastUpdate && Date.now() - +lastUpdate < 5000) {
        throw new Error("Please wait 5 seconds between updates");
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user?.id);
      
      if (error?.code === "23505") throw new Error("Name already exists");
      if (error) throw error;

      localStorage.setItem("lastProfileUpdate", Date.now().toString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated");
      dispatch({ type: "RESET", payload: { isDirty: false } });
    }
  });

  // Form Validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!formState.fullName.trim()) {
      errors.fullName = "Required field";
    } else if (formState.fullName.length < 2) {
      errors.fullName = "Minimum 2 characters";
    } else if (formState.fullName.length > 50) {
      errors.fullName = "Maximum 50 characters";
    }
    dispatch({ type: "SET_ERRORS", errors });
    return Object.keys(errors).length === 0;
  }, [formState.fullName]);

  // Submit Handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    updateProfile.mutate(formState.fullName);
  }, [formState.fullName, validateForm, updateProfile]);

  // Loading State
  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={previewUrl || profile?.avatar_url}
                    alt={profile?.full_name || "User avatar"}
                  />
                  <AvatarFallback>
                    {profile?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {uploadStatus === 'pending' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-full">
                    <div className="animate-spin border-2 border-t-transparent rounded-full h-8 w-8 border-white" />
                  </div>
                )}
              </div>

              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                  {uploadStatus === 'pending' ? "Uploading..." : "Change Avatar"}
                </div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  disabled={uploadStatus === 'pending'}
                />
              </Label>
            </div>
            
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formState.fullName}
                onChange={(e) => dispatch({
                  type: "SET_FIELD",
                  field: "fullName",
                  value: e.target.value,
                  validate: (val) => {
                    if (!val.trim()) return "Required field";
                    if (val.length < 2) return "Too short";
                    if (val.length > 50) return "Too long";
                    return "";
                  }
                })}
                aria-invalid={!!formState.errors.fullName}
              />
              {formState.errors.fullName && (
                <p className="text-red-500 text-sm">{formState.errors.fullName}</p>
              )}
            </div>
            
            {/* Form Actions */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!formState.isDirty || updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
              {formState.isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => dispatch({ type: "RESET", payload: { fullName: profile?.full_name || "" } })}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <AccountManagement />
    </div>
  );
};

export default ProfileManagement;