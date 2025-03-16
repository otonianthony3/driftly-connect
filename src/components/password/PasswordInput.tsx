import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  showStrengthRequirements?: boolean;
  autoFocus?: boolean;
  showCriteria?: boolean;
}

interface PasswordCriterion {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter password",
  className,
  showStrengthRequirements = false,
  autoFocus = false,
  showCriteria = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Password criteria for visual feedback
  const criteria: PasswordCriterion[] = [
    { id: "length", label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
    { id: "uppercase", label: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
    { id: "lowercase", label: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
    { id: "number", label: "Contains number", test: (pwd) => /[0-9]/.test(pwd) },
    { id: "special", label: "Contains special character", test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
  ];
  
  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
    // Maintain focus on input after clicking the toggle button
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle keyboard accessibility for the toggle button
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    }
  };

  // Automatically focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="space-y-2 w-full">
      <div 
        className={cn(
          "relative group rounded-md transition-all duration-200",
          isFocused && "ring-2 ring-offset-1 ring-blue-500",
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Input
          ref={inputRef}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "pr-10 transition-all duration-200", 
            isFocused ? "border-blue-500" : isHovering ? "border-gray-400" : "border-gray-200"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          aria-invalid={props["aria-invalid"]}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center pr-3",
            "text-gray-400 hover:text-gray-700 focus:text-gray-700",
            "outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md",
            "transition-colors duration-200"
          )}
        >
          {showPassword ? (
            <EyeOff size={18} className="transition-transform duration-200 hover:scale-110" />
          ) : (
            <Eye size={18} className="transition-transform duration-200 hover:scale-110" />
          )}
        </button>
      </div>
      
      {showStrengthRequirements && value.length > 0 && (
        <PasswordStrengthIndicator password={value} />
      )}

      {showCriteria && (
        <div className={cn(
          "space-y-1 text-sm transition-all duration-300",
          value.length > 0 || isFocused ? "opacity-100" : "opacity-0"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {criteria.map((criterion) => {
              const passed = criterion.test(value);
              return (
                <div 
                  key={criterion.id} 
                  className={cn(
                    "flex items-center space-x-2 transition-colors duration-300",
                    passed ? "text-green-600" : value.length > 0 ? "text-red-500" : "text-gray-500"
                  )}
                >
                  <span className="flex-shrink-0">
                    {passed ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      value.length > 0 ? (
                        <X size={14} className="text-red-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                      )
                    )}
                  </span>
                  <span className="text-xs">{criterion.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};