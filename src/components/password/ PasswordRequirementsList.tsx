import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirementsListProps {
  password: string;
  className?: string;
  showInitialState?: boolean;
}

export const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({ 
  password,
  className,
  showInitialState = true 
}) => {
  const requirements = [
    { 
      id: "length", 
      label: "At least 8 characters", 
      valid: password.length >= 8,
      hint: "Use a minimum of 8 characters for better security"
    },
    { 
      id: "number", 
      label: "At least one number", 
      valid: /\d/.test(password),
      hint: "Include numbers (0-9) in your password"
    },
    { 
      id: "special", 
      label: "At least one special character", 
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hint: "Add special characters like !@#$%^&*"
    },
    { 
      id: "uppercase", 
      label: "At least one uppercase letter", 
      valid: /[A-Z]/.test(password),
      hint: "Include capital letters (A-Z)"
    },
    { 
      id: "lowercase", 
      label: "At least one lowercase letter", 
      valid: /[a-z]/.test(password),
      hint: "Include lowercase letters (a-z)"
    }
  ];

  // Calculate overall progress
  const validCount = requirements.filter(req => req.valid).length;
  const progress = (validCount / requirements.length) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">Requirements</span>
        <span className="text-xs">{validCount}/{requirements.length} met</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300 ease-out",
            progress === 100 ? "bg-green-500" : 
            progress >= 60 ? "bg-yellow-500" : 
            progress > 0 ? "bg-orange-500" : 
            "bg-red-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <ul className="space-y-2">
        {requirements.map((req) => {
          // Determine state: valid, invalid (if password entered), or neutral (no password yet)
          const state = password === "" && !showInitialState ? "neutral" : 
                       req.valid ? "valid" : "invalid";
          
          return (
            <li 
              key={req.id} 
              className={cn(
                "flex items-start text-sm transition-all duration-200",
                "hover:bg-gray-50 rounded-md p-1",
                state === "valid" ? "text-green-700" : 
                state === "invalid" ? "text-red-600" : 
                "text-gray-500"
              )}
            >
              <div className="flex-shrink-0 mr-2 mt-0.5">
                {state === "valid" ? (
                  <Check size={16} className="text-green-500" />
                ) : state === "invalid" ? (
                  <X size={16} className="text-red-500" />
                ) : (
                  <AlertCircle size={16} className="text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium">{req.label}</p>
                {state !== "valid" && (
                  <p className="text-xs text-gray-500 mt-0.5">{req.hint}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};