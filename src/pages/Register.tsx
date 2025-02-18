import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
// Removed: import { AdminTierSelection } from "@/components/AdminTierSelection";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Removed: const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Removed admin tier check
    // if (!selectedTierId) {
    //   toast.error("Please select an admin tier");
    //   return;
    // }

    setIsLoading(true);

    try {
      // Create the user without sending an admin tier.
      // Optionally, you can set a default role by including role: "client" if your backend supports it.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            // Removed tier_id so that the user is created as a client by default.
            // If needed, you could explicitly set it: role: "client"
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

        {/* Removed AdminTierSelection */}
        {/* <AdminTierSelection 
          selectedTierId={selectedTierId} 
          onSelectTier={setSelectedTierId} 
        /> */}

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