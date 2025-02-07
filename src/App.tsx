
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
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

// Helper component to handle swipe navigation
const SwipeHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define the navigation order for authenticated routes
  const authenticatedRoutes = [
    '/client/dashboard',
    '/payouts/history',
    '/notifications',
    '/profile'
  ];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = authenticatedRoutes.indexOf(location.pathname);
      if (currentIndex >= 0 && currentIndex < authenticatedRoutes.length - 1) {
        navigate(authenticatedRoutes[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = authenticatedRoutes.indexOf(location.pathname);
      if (currentIndex > 0) {
        navigate(authenticatedRoutes[currentIndex - 1]);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Only apply swipe handlers to authenticated routes
  if (!authenticatedRoutes.includes(location.pathname)) {
    return null;
  }

  return <div {...handlers} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />;
};

// Helper component to conditionally render NotificationBell
const ConditionalNotificationBell = () => {
  const location = useLocation();
  const publicRoutes = ['/', '/login', '/register', '/reset-password', '/update-password'];
  
  if (publicRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <NotificationBell />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SwipeHandler />
          <ConditionalNotificationBell />
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
