import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SecurityActivity from "@/components/security/SecurityActivity";
import { User } from "@/types/user";

interface SecurityTabProps {
  user: User;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Verification</CardTitle>
        <CardDescription>Manage your account security and verification status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <h4 className="font-medium">Account Verification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <VerificationCard
                title="Email Verification"
                isVerified={user.email_verified}
                verifyButtonText="Verify Now"
              />
              <VerificationCard
                title="Phone Verification"
                isVerified={user.phone_verified}
                verifyButtonText="Add Phone"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
            <div className="flex items-center p-4 border rounded-md">
              <div className="flex-1">
                <p className="font-medium">2FA Status</p>
                <p className="text-sm text-muted-foreground">
                  {user.two_factor_enabled 
                    ? "Enabled - Your account has an extra layer of security" 
                    : "Disabled - Enable for additional security"}
                </p>
              </div>
              {user.two_factor_enabled ? (
                <Button size="sm" variant="outline">Manage 2FA</Button>
              ) : (
                <Button size="sm">Enable 2FA</Button>
              )}
            </div>
          </div>

          <SecurityActivity userId={user.id} />
        </div>
      </CardContent>
    </Card>
  );
};

interface VerificationCardProps {
  title: string;
  isVerified?: boolean;
  verifyButtonText: string;
}

const VerificationCard: React.FC<VerificationCardProps> = ({
  title,
  isVerified,
  verifyButtonText
}) => {
  return (
    <div className="flex items-center p-4 border rounded-md">
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{isVerified ? "Verified" : "Not verified"}</p>
      </div>
      {isVerified ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
      ) : (
        <Button size="sm" variant="outline">{verifyButtonText}</Button>
      )}
    </div>
  );
};

export default SecurityTab;
