
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionInfo, SubscriptionTier, getSubscriptionInfo } from "@/services/subscriptionService";

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
    if (user) {
      const info = await getSubscriptionInfo();
      setSubscriptionInfo(info);
    } else {
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
          
          // After authentication state changes, refresh subscription info
          if (currentSession?.user) {
            setTimeout(async () => {
              await refreshSubscriptionInfo();
            }, 0);
          }
        }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      
      // After initial session check, get subscription info
      if (currentSession?.user) {
        await refreshSubscriptionInfo();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
