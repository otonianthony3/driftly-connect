import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import React from "react";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    const savedEmail = localStorage.getItem("registerEmail");
    return savedEmail || "";
  });
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(() => {
    const savedName = localStorage.getItem("registerFullName");
    return savedName || "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [disposablePatterns, setDisposablePatterns] = useState<RegExp[]>([]);
  const isMobile = useIsMobile();
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    number: false
  });
  const [formTouched, setFormTouched] = useState({
    email: false,
    password: false,
    fullName: false
  });
  const [validationSuccess, setValidationSuccess] = useState({
    email: false,
    fullName: false
  });
  const [statusMessage, setStatusMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  // Load disposable email patterns from database
  useEffect(() => {
    const fetchPatterns = async () => {
      const { data, error } = await supabase
        .from('email_patterns')
        .select('pattern');
      
      if (!error && data) {
        setDisposablePatterns(data.map(p => new RegExp(p.pattern, 'i')));
      }
    };

    fetchPatterns();
  }, []);

  // Debounced email validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && formTouched.email) {
        const validation = validateEmail(email);
        if (!validation.isValid) {
          setEmailError(validation.message || "Invalid email");
          setValidationSuccess(prev => ({ ...prev, email: false }));
        } else {
          setEmailError("");
          setValidationSuccess(prev => ({ ...prev, email: true }));
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, formTouched.email, disposablePatterns]);

  // Password strength calculation
  useEffect(() => {
    if (password) {
      let strength = 0;
      const hasLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
      
      setPasswordErrors({ length: hasLength, uppercase: hasUpperCase, number: hasNumber });
      strength = [hasLength, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
      setPasswordErrors({ length: false, uppercase: false, number: false });
    }
  }, [password]);

  // Form persistence
  useEffect(() => {
    if (email) localStorage.setItem("registerEmail", email);
    if (fullName) localStorage.setItem("registerFullName", fullName);
  }, [email, fullName]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { isValid: false, message: "Invalid email format" };

    const domain = email.split('@')[1].toLowerCase();
    if (disposablePatterns.some(pattern => pattern.test(domain))) {
      return { isValid: false, message: "Disposable emails not allowed" };
    }

    const commonTypos = [
      { wrong: 'gmial.com', correct: 'gmail.com' },
      { wrong: 'yaho.com', correct: 'yahoo.com' },
      { wrong: 'hotmal.com', correct: 'hotmail.com' },
    ];

    const typo = commonTypos.find(t => domain === t.wrong);
    if (typo) return { 
      isValid: false, 
      message: `Did you mean ${email.replace(typo.wrong, typo.correct)}?`
    };

    return { isValid: true };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRateLimit()) return;

    // Validation checks
    if (passwordStrength < 2 || !acceptedTerms) {
      toast.error("Please complete all requirements");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;
      if (data.user) {
        localStorage.removeItem("registerEmail");
        localStorage.removeItem("registerFullName");
        toast.success("Check your email for verification");
        navigate("/login");
      }
    } catch (error: any) {
      handleRegistrationError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationError = (error: any) => {
    console.error("Registration error:", error);
    let message = "Registration failed";

    if (error.message.includes("already registered")) {
      message = "Email already registered";
      toast.error(message, {
        action: { label: "Login", onClick: () => navigate("/login") }
      });
    } else {
      message = error.message || "An error occurred";
      toast.error(message);
    }
    setStatusMessage(message);
  };

  const checkRateLimit = () => {
    const now = Date.now();
    const RATE_LIMIT_WINDOW = 60000;
    if (now - lastAttemptTime > RATE_LIMIT_WINDOW) {
      setAttemptCount(1);
      setLastAttemptTime(now);
      return true;
    }
    if (attemptCount < 3) {
      setAttemptCount(prev => prev + 1);
      setLastAttemptTime(now);
      return true;
    }
    toast.error("Too many attempts. Please wait.");
    return false;
  };

  // Helper functions
  const getStrengthColor = () => {
    const colors = ["bg-gray-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
    return colors[passwordStrength] || "bg-gray-200";
  };

  const getStrengthText = () => {
    const texts = ["", "Weak", "Fair", "Good", "Strong"];
    return texts[passwordStrength] || "";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-primary/5 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Enter your details to begin</p>
        </div>

        <div aria-live="polite" className="sr-only" ref={statusRef}>
          {statusMessage}
        </div>

        <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            onBlur={() => setFormTouched(prev => ({ ...prev, fullName: true }))}
            className="h-11 sm:h-10"
            required
          />

          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              onBlur={() => setFormTouched(prev => ({ ...prev, email: true }))}
              className={`h-11 sm:h-10 ${
                emailError ? 'border-red-500' : validationSuccess.email ? 'border-green-500' : ''
              }`}
              required
            />
            {validationSuccess.email && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
            )}
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-11 sm:h-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            
            {password && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className={`${getStrengthColor()} h-full transition-all`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{getStrengthText()}</span>
                </div>
                <div className="text-xs space-y-1">
                  <p className={passwordErrors.length ? "text-green-500" : "text-gray-500"}>
                    {passwordErrors.length ? "✓" : "○"} 8+ characters
                  </p>
                  <p className={passwordErrors.uppercase ? "text-green-500" : "text-gray-500"}>
                    {passwordErrors.uppercase ? "✓" : "○"} Uppercase letter
                  </p>
                  <p className={passwordErrors.number ? "text-green-500" : "text-gray-500"}>
                    {passwordErrors.number ? "✓" : "○"} Number
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
              required
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !!emailError || passwordStrength < 2 || !acceptedTerms}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : "Register"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

// Preload login component
export const PreloadLogin = () => {
  useEffect(() => {
    import("./Login");
  }, []);
  return null;
};

export default Register;