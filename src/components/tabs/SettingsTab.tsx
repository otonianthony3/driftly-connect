import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ExportData from "@/components/profile/ExportData";
import DeleteAccountDialog from "@/components/profile/DeleteAccountDialog";

interface SettingsTabProps {
  userId: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ userId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account, privacy, and data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ExportData userId={userId} />
        <DeleteAccountDialog userId={userId} />
      </CardContent>
    </Card>
  );
};

export default SettingsTab;