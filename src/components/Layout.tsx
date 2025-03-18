
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { motion } from "./ui/motion";

const Layout = () => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <motion.div 
          className="h-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
            <Outlet />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Layout;
