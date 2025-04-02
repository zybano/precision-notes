
import { Outlet, Navigate, Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

const Layout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Check if the current path is part of the hospital system
  const isHospitalRoute = location.pathname.startsWith('/hospital');

  // Check if user has enterprise subscription
  // In a real app, this would come from a database or user metadata
  const userSubscriptionLevel = user?.user_metadata?.subscription_level || 'free';
  const hasEnterpriseAccess = userSubscriptionLevel === 'enterprise';

  // Redirect if trying to access hospital routes without enterprise subscription
  if (isHospitalRoute && !hasEnterpriseAccess) {
    toast.error("Hospital system requires Enterprise subscription");
    return <Navigate to="/pricing" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full">
          <header className="h-14 flex items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 w-full">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link to="/">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <Button variant="ghost" size="icon" className="flex sm:hidden">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Stethoscope className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.user_metadata?.full_name || user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6 w-full">
            <Outlet />
          </main>
        </div>
      </div>
  );
};

export default Layout;
