
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionInfo, getSubscriptionInfo } from "@/services/subscriptionService";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  subscriptionInfo: SubscriptionInfo | null;
  refreshSubscriptionInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  const refreshSubscriptionInfo = async () => {
    console.log('🔄 refreshSubscriptionInfo called. User:', user?.id);
    if (user) {
      console.log('👤 Fetching subscription info for user:', user.id);
      const info = await getSubscriptionInfo();
      console.log('📦 Subscription info received:', info);
      setSubscriptionInfo(info);
    } else {
      console.log('❌ No user, setting subscription info to null');
      setSubscriptionInfo(null);
    }
  };

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          console.log("Auth state changed:", event, currentSession?.user?.id);
          
          if (event === 'SIGNED_OUT') {
            toast.info("Signed out successfully");
            setSubscriptionInfo(null);
          }

          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Separate useEffect to watch for user changes and refresh subscription info
  useEffect(() => {
    console.log('👤 User changed:', user?.id);
    if (user) {
      console.log('🔄 Refreshing subscription info due to user change');
      refreshSubscriptionInfo();
    } else {
      console.log('❌ No user, clearing subscription info');
      setSubscriptionInfo(null);
    }
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
      <AuthContext.Provider value={{ 
        session, 
        user, 
        isLoading, 
        signOut, 
        subscriptionInfo,
        refreshSubscriptionInfo
      }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
