import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ThriftSystemDetails from "./pages/ThriftSystemDetails";
import PayoutHistory from "./pages/PayoutHistory";
import PayoutManagement from "./pages/PayoutManagement";
import ProfileManagement from "./pages/ProfileManagement";
import PasswordReset from "./pages/PasswordReset";
import UpdatePassword from "./pages/UpdatePassword";
import { NotificationBell } from "./components/NotificationBell";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="fixed top-4 right-4 z-50">
            <NotificationBell />
          </div>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/thrift-system/:id" element={<ThriftSystemDetails />} />
            <Route path="/payouts/history" element={<PayoutHistory />} />
            <Route path="/admin/payouts" element={<PayoutManagement />} />
            <Route path="/profile" element={<ProfileManagement />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/update-password" element={<UpdatePassword />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;