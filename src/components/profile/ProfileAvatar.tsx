import { useCallback } from "react";
import AvatarUpload from "./AvatarUpload";
import { useQueryClient } from "@tanstack/react-query";
// Note: The AvatarUpload component uses Sonner toast, not the UI toast component

interface ProfileAvatarProps {
  userId: string;
  avatarUrl: string | null;
  userName: string;
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  userId,
  avatarUrl,
  userName,
  className,
}) => {
  const queryClient = useQueryClient();

  // Handle successful avatar upload
  const handleUploadSuccess = useCallback((newAvatarUrl: string) => {
    // Update user data in cache
    queryClient.setQueryData(["user", userId], (oldData: any) => ({
      ...oldData,
      avatarUrl: newAvatarUrl,
    }));
    
    // Note: No need to manually toast here as AvatarUpload already handles toasts
  }, [userId, queryClient]);

  return (
    <AvatarUpload
      userId={userId}
      avatarUrl={avatarUrl || undefined}
      userName={userName}
      className={className}
      onUploadSuccess={handleUploadSuccess}
    />
  );
};

export default ProfileAvatar;