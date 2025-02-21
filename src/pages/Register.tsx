
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// List of common disposable email domains
const disposableEmailDomains = [
  'tempmail.com',
  'temp-mail.org',
  'disposablemail.com',
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
];

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const validateEmail = (email: string): { isValid: boolean; message?: string } => {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    // Check for disposable email domains
    const domain = email.split('@')[1].toLowerCase();
    if (disposableEmailDomains.includes(domain)) {
      return { isValid: false, message: "Disposable email addresses are not allowed" };
    }

    // Additional validation for common typos
    const commonTypos = [
      { wrong: 'gmial.com', correct: 'gmail.com' },
      { wrong: 'yaho.com', correct: 'yahoo.com' },
      { wrong: 'hotmal.com', correct: 'hotmail.com' },
      { wrong: 'outlock.com', correct: 'outlook.com' }
    ];

    for (const typo of commonTypos) {
      if (domain === typo.wrong) {
        return { 
          isValid: false, 
          message: `Did you mean ${email.replace(typo.wrong, typo.correct)}?` 
        };
      }
    }

    return { isValid: true };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before proceeding
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.message);
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        console.error("Registration error:", error);
        toast.error(error.message);
        return;
      }

      if (data?.user) {
        toast.success("Registration successful. Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Unexpected registration error:", error);
      toast.error("An unexpected error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-primary/5 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Enter your details to get started
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 sm:h-10 text-base sm:text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long and contain at least one uppercase letter and one number
            </p>
          </div>
          <Button
            type="submit"
            className="w-full h-11 sm:h-10 text-base sm:text-sm"
            size={isMobile ? "lg" : "default"}
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="text-center text-sm sm:text-base">
          Already have an account?{" "}
          <Button
            variant="link"
            className="text-sm sm:text-base"
            onClick={() => navigate("/login")}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;
