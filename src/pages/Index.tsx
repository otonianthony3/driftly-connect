import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

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