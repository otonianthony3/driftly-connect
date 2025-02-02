import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          toast({
            title: "Authentication Error",
            description: "There was a problem checking your login status",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (session) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error("Profile error:", profileError);
              toast({
                title: "Profile Error",
                description: "Could not fetch user profile",
                variant: "destructive",
              });
              setIsLoading(false);
              return;
            }

            if (profile?.role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              navigate('/client/dashboard');
            }
          } catch (error) {
            console.error("Profile fetch error:", error);
            toast({
              title: "Error",
              description: "An unexpected error occurred",
              variant: "destructive",
            });
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-primary/5 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-6 sm:space-y-8 max-w-md w-full">
        <div className="space-y-2 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome to Driftly</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-sm mx-auto">
            Join our community-driven thrift system and start saving together.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            size={isMobile ? "lg" : "default"}
            className="w-full sm:w-auto min-w-[150px] text-base sm:text-sm"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            size={isMobile ? "lg" : "default"}
            variant="outline"
            className="w-full sm:w-auto min-w-[150px] text-base sm:text-sm"
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;