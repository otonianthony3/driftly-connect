/ src/types/user.ts
export interface User {
  id: string;
  full_name: string;
  bio?: string;
  location?: string;
  website?: string;
  social_twitter?: string;
  social_instagram?: string;
  social_linkedin?: string;
  is_public?: boolean;
  cover_image_url?: string;
  avatar_url?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  subscription_plan?: "free" | "basic" | "premium" | "enterprise";
  subscription_status?: "active" | "canceled" | "past_due";
  subscription_renewal?: string;
  theme_preference?: "light" | "dark" | "system";
}

export interface NotificationPreferences {
  email_updates: boolean;
  push_notifications: boolean;
  weekly_digest: boolean;
  marketing_emails: boolean;
  security_alerts: boolean;
}

export interface PrivacySettings {
  profile_visibility: "public" | "contacts" | "private";
  search_visible: boolean;
  show_location: boolean;
  show_social: boolean;
  activity_visible: boolean;
}