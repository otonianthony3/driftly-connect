import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<string>("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-primary/5">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Register for a new account</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Input type="email" placeholder="Email" required />
          </div>
          <div className="space-y-2">
            <Input type="password" placeholder="Password" required />
          </div>
          <div className="space-y-2">
            <Input type="password" placeholder="Confirm Password" required />
          </div>
          <Select onValueChange={setRole} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate("/login")}
            className="text-sm"
          >
            Already have an account? Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;