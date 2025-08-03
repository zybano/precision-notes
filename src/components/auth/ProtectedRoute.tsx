import {Navigate, Outlet, useLocation} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext";
import {Spinner} from "@/components/ui/spinner";
import {EnterpriseAccessDialog} from "@/components/hospital/EnterpriseAccessDialog";
import {useState} from "react";
import {hasSubscriptionAccess} from "@/services/subscriptionService";

const ProtectedRoute = () => {
  const { user, isLoading, subscriptionInfo } = useAuth();
  const location = useLocation();
  const [showEnterpriseDialog, setShowEnterpriseDialog] = useState(false);
  
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
    const userSubscriptionTier = subscriptionInfo?.tier || 'free';
    const hasEnterpriseAccess = hasSubscriptionAccess(userSubscriptionTier, 'enterprise');
    
    if (!hasEnterpriseAccess) {
      // Show enterprise access dialog when user tries to access a hospital route without enterprise access
      setTimeout(() => setShowEnterpriseDialog(true), 10);
      return (
        <>
          <EnterpriseAccessDialog
            open={showEnterpriseDialog}
            onOpenChange={setShowEnterpriseDialog}
          />
          <Navigate to="/pricing" replace />
        </>
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
