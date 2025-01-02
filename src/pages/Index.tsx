import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Redirect based on user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/client/dashboard');
        }
      }
    };

    checkUser();
  }, [navigate]);

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