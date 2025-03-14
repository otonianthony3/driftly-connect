import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ProfileCover from "@/components/profile/ProfileCover";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileForm from "@/components/profile/ProfileForm";
import { User } from "@/types/user";

interface ProfileTabProps {
  user: User;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information and public profile</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileCover userId={user.id} coverImageUrl={user.cover_image_url} />
        <div className="relative -mt-14 ml-4">
          <ProfileAvatar 
            userId={user.id} 
            avatarUrl={user.avatar_url}
            userName={user.full_name}
          />
        </div>
        <ProfileForm 
          userId={user.id}
          fullName={user.full_name}
          bio={user.bio}
          location={user.location}
          socialTwitter={user.social_twitter}
          socialInstagram={user.social_instagram}
          socialLinkedIn={user.social_linkedin}
          isPublic={user.is_public}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileTab;