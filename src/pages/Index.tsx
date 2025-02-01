import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-primary/5">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Driftly</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Join our community-driven thrift system and start saving together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="min-w-[150px]"
          >
            Login
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/register")}
            className="min-w-[150px]"
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;