
import { Link } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import precisionLogo from '/lovable-uploads/precision.jpeg'; // Adjust path as needed
import precisionNote from '/lovable-uploads/PrecisionNote.jpeg';
import SignUpForm from "@/components/auth/SignUpForm.tsx"; // Adjust path as needed

const SignUp = () => {
  return (
      <div className="min-h-screen w-full overflow-hidden">
        <div className="flex h-screen flex-col md:flex-row">
          {/* Left side with login card - centered both horizontally and vertically */}
          <div className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                    <a href="/" target="_self" rel="noreferrer">
                      <img
                          src={precisionLogo}
                          alt="PrecisionNote"
                          className="h-full w-full object-contain"
                      />
                    </a>
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                <CardDescription className="text-center">
                  Enter your information to get started with PrecisionNote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignUpForm />
              </CardContent>
              <CardFooter className="justify-center">
                <div className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Login
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Right side with image - hidden on mobile, visible on md and up */}
          <div className="hidden md:flex md:flex-1 items-center justify-center bg-gray-100">
            <img
                src={precisionNote}
                alt="Login illustration"
                className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
  );
};

export default SignUp;
