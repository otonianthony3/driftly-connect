
// src/components/tabs/NotificationsTab.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { NotificationPreferences } from "@/types/user";

interface NotificationsTabProps {
notificationPreferences: NotificationPreferences;
onNotificationChange: (key: string) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ 
notificationPreferences, 
onNotificationChange 
}) => {
return (
<Card>
<CardHeader>
<CardTitle>Notification Preferences</CardTitle>
<CardDescription>Control how and when we notify you</CardDescription>
</CardHeader>
<CardContent className="space-y-6">
<div className="space-y-4">
  <NotificationToggle
    title="Email Updates"
    description="Receive updates about account activity"
    checked={notificationPreferences.email_updates}
    onChange={() => onNotificationChange('email_updates')}
  />
  
  <NotificationToggle
    title="Push Notifications"
    description="Receive notifications on your device"
    checked={notificationPreferences.push_notifications}
    onChange={() => onNotificationChange('push_notifications')}
  />
  
  <NotificationToggle
    title="Weekly Digest"
    description="Receive a weekly summary of activity"
    checked={notificationPreferences.weekly_digest}
    onChange={() => onNotificationChange('weekly_digest')}
  />
  
  <NotificationToggle
    title="Marketing Emails"
    description="Receive product updates and offers"
    checked={notificationPreferences.marketing_emails}
    onChange={() => onNotificationChange('marketing_emails')}
  />
  
  <NotificationToggle
    title="Security Alerts"
    description="Receive security-related notifications"
    checked={notificationPreferences.security_alerts}
    onChange={() => onNotificationChange('security_alerts')}
  />
</div>
<div className="pt-4">
  <Button>Save Preferences</Button>
</div>
</CardContent>
</Card>
);
};

interface NotificationToggleProps {
title: string;
description: string;
checked: boolean;
onChange: () => void;
}

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

// src/components/tabs/