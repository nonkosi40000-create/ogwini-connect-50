import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, UserCircle } from "lucide-react";
import { useAuth, useRoleRedirect } from "@/hooks/useAuth";
import schoolClassroom from "@/assets/school-classroom.jpg";

type LoginRole = "learner" | "teacher" | "grade_head" | "principal" | "admin" | "hod" | "llc" | "finance" | "librarian";

const roleLabels: Record<LoginRole, string> = {
  learner: "Learner",
  teacher: "Teacher",
  grade_head: "Grade Head",
  hod: "Head of Department (HOD)",
  llc: "Language Learning Coordinator (LLC)",
  principal: "Principal",
  admin: "Administrator",
  finance: "Finance",
  librarian: "Librarian",
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<LoginRole | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, user, loading, role: userRole } = useAuth();
  const { redirectToDashboard, dataLoaded } = useRoleRedirect();
  const navigate = useNavigate();

  // Redirect if already logged in and data is loaded
  useEffect(() => {
    if (!loading && user && dataLoaded) {
      redirectToDashboard();
    }
  }, [user, loading, dataLoaded, redirectToDashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      return;
    }
    
    setIsSubmitting(true);
    
    const { error, user: signedInUser } = await signIn(email, password);
    
    if (!error && signedInUser) {
      // Data is already loaded in signIn, redirect with welcome message
      redirectToDashboard(true);
    }
    
    setIsSubmitting(false);
  };

  // Show loading if checking existing session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={schoolClassroom}
          alt="Ogwini Comprehensive Technical High School"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg">Ogwini</span>
              <p className="text-xs text-white/80">Technical High School</p>
            </div>
          </Link>
          
          <div>
            <h1 className="font-heading text-4xl font-bold mb-4">
              Welcome Back to
              <br />
              Ogwini Portal
            </h1>
            <p className="text-white/90 max-w-md">
              Access your personalized dashboard, academic resources, and stay connected with your school community.
            </p>
          </div>

          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} Ogwini Comprehensive Technical High School
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg text-foreground">Ogwini</span>
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Sign In</h2>
          <p className="text-muted-foreground mb-8">Select your role and enter credentials to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="role">Login As *</Label>
              <div className="relative mt-1.5">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as LoginRole)}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address (@gmail.com)</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your @gmail.com email"
                  required
                />
              </div>
              {email && !/^[^\s@]+@gmail\.com$/i.test(email) && (
                <p className="text-xs text-destructive mt-1">Email must end with @gmail.com</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !selectedRole || (!!email && !/^[^\s@]+@gmail\.com$/i.test(email))}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
