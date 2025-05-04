
import { Navigate } from "react-router-dom";

const BlogPage = () => {
  // Redirect to Blog page
  return <Navigate to="/blog" replace />;
};

export default BlogPage;
