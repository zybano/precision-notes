import {Navigate} from "react-router-dom";

const SettingsPage = () => {
  // Redirect to Settings page
  return <Navigate to="/settings" replace />;
};

export default SettingsPage;
