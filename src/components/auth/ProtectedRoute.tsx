
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Check if the current path is part of the hospital system
  const isHospitalRoute = location.pathname.startsWith('/hospital');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If this is a hospital route, check subscription level
  if (isHospitalRoute) {
    // In a real app, this would come from a database or user metadata
    const userSubscriptionLevel = user.user_metadata?.subscription_level || 'free';
    const hasEnterpriseAccess = userSubscriptionLevel === 'enterprise';
    
    if (!hasEnterpriseAccess) {
      toast.error("Hospital system requires Enterprise subscription");
      return <Navigate to="/pricing" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
