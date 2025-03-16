import React from "react";
import { Link } from "react-router-dom";
import { KeyRound, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PasswordRecoveryOptionsProps {
  className?: string;
  showTitle?: boolean;
}

export const PasswordRecoveryOptions: React.FC<PasswordRecoveryOptionsProps> = ({
  className = "",
  showTitle = true,
}) => {
  return (
    <Card className={`border-gray-100 shadow-sm ${className}`}>
      {showTitle && (
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-700">Account Recovery Options</h3>
        </div>
      )}
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <h4 className="text-sm font-medium text-gray-800">Forgot your password?</h4>
              <p className="mt-1 text-xs text-gray-500">
                We'll help you recover access to your account
              </p>
              <Button
                variant="link"
                asChild
                className="h-auto p-0 text-blue-600 hover:text-blue-800"
              >
                <Link to="/recover-password">Recover your account</Link>
              </Button>
            </div>
          </div>

          <div className="my-3 border-t border-gray-100"></div>

          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 items-center justify-center">
              <Mail className="h-4 w-4 text-green-500" />
              <Phone className="h-4 w-4 text-blue-500 -ml-2 mt-1" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-800">Update recovery methods</h4>
              <p className="mt-1 text-xs text-gray-500">
                Keep your recovery email and phone number updated
              </p>
              <Button
                variant="link"
                asChild
                className="h-auto p-0 text-blue-600 hover:text-blue-800"
              >
                <Link to="/update-recovery">Update recovery methods</Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <p>Need more help? <Link to="/help" className="text-blue-600 hover:text-blue-800">Contact support</Link></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};