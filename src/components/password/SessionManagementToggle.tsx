import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface SessionManagementToggleProps {
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const SessionManagementToggle: React.FC<SessionManagementToggleProps> = ({
  isChecked,
  onToggle,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`mt-4 flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="logoutOtherSessions" className="text-sm font-medium">
            Log out from all other sessions
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  When enabled, this will immediately terminate all other active sessions across all devices.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-gray-500">
          Enhance your account security by logging out from all other devices
        </p>
      </div>
      <Switch
        id="logoutOtherSessions"
        checked={isChecked}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label="Log out from all other sessions"
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );
};