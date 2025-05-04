
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  // Redirect to Login page
  return <Navigate to="/login" replace />;
};

export default LoginPage;
