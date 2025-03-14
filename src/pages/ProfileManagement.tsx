import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, ShieldCheck, CreditCard, Moon, Sun } from "lucide-react";
import { User, NotificationPreferences, PrivacySettings } from "@/types/user";
import ProfileTab from "@/components/tabs/ProfileTab";
import NotificationsTab from "@/components/tabs/NotificationsTab";
import PrivacyTab from "@/components/tabs/PrivacyTab";
import SecurityTab from "@/components/tabs/SecurityTab";
import SubscriptionTab from "@/components/tabs/SubscriptionTab";
import AppearanceTab from "@/components/tabs/AppearanceTab";
import SettingsTab from "@/components/tabs/SettingsTab";

interface ProfileManagementProps {
  user: User;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email_updates: true,
    push_notifications: true,
    weekly_digest: false,
    marketing_emails: false,
    security_alerts: true
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: user.is_public ? "public" : "private",
    search_visible: true,
    show_location: !!user.location,
    show_social: true,
    activity_visible: true
  });
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">(
    user.theme_preference || "system"
  );

  const handleNotificationChange = (key: string) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key as keyof NotificationPreferences]
    }));
  };

  const handlePrivacyVisibilityChange = (value: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      profile_visibility: value as "public" | "contacts" | "private"
    }));
  };

  const handlePrivacyToggleChange = (key: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof PrivacySettings]
    }));
  };

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setThemePreference(value);
    // In a real application, you would also apply the theme change and save to user preferences
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-2 h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="appearance">
            {themePreference === "dark" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            Appearance
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab
            notificationPreferences={notificationPreferences}
            onNotificationChange={handleNotificationChange}
          />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab
            privacySettings={privacySettings}
            onPrivacyVisibilityChange={handlePrivacyVisibilityChange}
            onPrivacyToggleChange={handlePrivacyToggleChange}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab user={user} />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionTab user={user} />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceTab
            themePreference={themePreference}
            onThemeChange={handleThemeChange}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileManagement