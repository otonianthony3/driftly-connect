const NotificationToggle: React.FC<NotificationToggleProps> = ({
    title,
    description,
    checked,
    onChange
  }) => {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    );
  };
  
  export default NotificationsTab;
  
  // src/components/tabs/PrivacyTab.tsx
  import React from "react";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
  import { Switch } from "@/components/ui/switch";
  import { Button } from "@/components/ui/button";
  import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
  import { Label } from "@/components/ui/label";
  import { PrivacySettings } from "@/types/user";
  
  interface PrivacyTabProps {
    privacySettings: PrivacySettings;
    onPrivacyVisibilityChange: (value: string) => void;
    onPrivacyToggleChange: (key: string) => void;
  }
  
  const PrivacyTab: React.FC<PrivacyTabProps> = ({
    privacySettings,
    onPrivacyVisibilityChange,
    onPrivacyToggleChange
  }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Privacy Controls</CardTitle>
          <CardDescription>Manage who can see your profile and how your information is used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Profile Visibility</h4>
              <RadioGroup 
                value={privacySettings.profile_visibility}
                onValueChange={onPrivacyVisibilityChange}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">Public - Anyone can view your profile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contacts" id="contacts" />
                  <Label htmlFor="contacts">Contacts Only - Only your connections can view your profile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Private - Your profile is hidden from everyone</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-4 pt-2">
              <PrivacyToggle
                title="Search Engine Visibility"
                description="Allow search engines to index your profile"
                checked={privacySettings.search_visible}
                onChange={() => onPrivacyToggleChange('search_visible')}
              />
              
              <PrivacyToggle
                title="Show Location"
                description="Display your location on your profile"
                checked={privacySettings.show_location}
                onChange={() => onPrivacyToggleChange('show_location')}
              />
              
              <PrivacyToggle
                title="Show Social Links"
                description="Display your social media links"
                checked={privacySettings.show_social}
                onChange={() => onPrivacyToggleChange('show_social')}
              />
              
              <PrivacyToggle
                title="Activity Visibility"
                description="Allow others to see your activity and interactions"
                checked={privacySettings.activity_visible}
                onChange={() => onPrivacyToggleChange('activity_visible')}
              />
            </div>
          </div>
          <div className="pt-4">
            <Button>Save Privacy Settings</Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  interface PrivacyToggleProps {
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }
  
  const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
    title,
    description,
    checked,
    onChange
  }) => {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    );
  };
  
  export default PrivacyTab;
  