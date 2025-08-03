import {useEffect, useState} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {checkCreatorIdColumn, setupSupabaseFunctions} from "@/services/database/dbInitializer";

interface DocumentationInitializerProps {
  children: React.ReactNode;
}

const DocumentationInitializer: React.FC<DocumentationInitializerProps> = ({ children }) => {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Supabase functions if needed
  useEffect(() => {
    const initDb = async () => {
      if (user) {
        try {
          // First ensure our RPC functions exist
          await setupSupabaseFunctions();
          
          // Then check for the creator_id column
          const hasCreatorId = await checkCreatorIdColumn();
          if (!hasCreatorId) {
            console.log("Creator ID column doesn't exist, using alternative queries");
          }
          setIsInitializing(false);
        } catch (error) {
          console.error("Error initializing database:", error);
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    
    initDb();
  }, [user]);

  if (isInitializing) {
    return (
      <div className="container px-4 mx-auto w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading documentation...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DocumentationInitializer;
