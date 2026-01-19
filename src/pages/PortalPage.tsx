import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  User, FileText, CreditCard, Clock, CheckCircle, XCircle, LogOut, 
  ArrowRight, GraduationCap 
} from "lucide-react";
import { useAuth, useRoleRedirect } from "@/hooks/useAuth";
import schoolTrophy from "@/assets/school-trophy.jpg";

export default function PortalPage() {
  const { user, registration, role, loading, signOut, isApproved, profile } = useAuth();
  const { redirectToDashboard } = useRoleRedirect();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Render based on user status
  const renderContent = () => {
    if (!user) {
      return (
        <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-4">Access Your Portal</h3>
          <p className="text-muted-foreground mb-6">
            Sign in to view your personal information and academic reports.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/registration">Register</Link>
            </Button>
          </div>
        </div>
      );
    }

    if (registration?.status === "pending") {
      return (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Registration Pending</h3>
          <p className="text-muted-foreground mb-4">
            Your registration is awaiting approval from the school administration. You'll receive an email once your account is activated.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Registered as: <span className="font-semibold text-accent capitalize">{registration.role}</span>
          </p>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      );
    }

    if (registration?.status === "declined") {
      return (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Registration Declined</h3>
          <p className="text-muted-foreground mb-6">
            Unfortunately, your registration was not approved. Please contact the school administration for more information.
          </p>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      );
    }

    if (isApproved && role) {
      return (
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
              Welcome, {profile?.first_name ?? (user?.user_metadata as any)?.first_name ?? "there"}!
            </h3>
            <p className="text-muted-foreground mb-2">
              Your account is active and ready to use.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Role: <span className="font-semibold text-primary capitalize">{role.replace("_", " ")}</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => redirectToDashboard()}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Portal Features */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Personal Information */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Personal Information</h3>
              <p className="text-muted-foreground text-sm mb-4">
                View and update your contact details, address, and parent/guardian information.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Update contact details
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Manage parent info
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Update address
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/profile">View Profile</Link>
              </Button>
            </div>

            {/* Academic Reports */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Academic Reports</h3>
              <p className="text-muted-foreground text-sm mb-4">
                View and download your academic reports uploaded by teachers.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  View term reports
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Download as PDF
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Track progress
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/profile">View Reports</Link>
              </Button>
            </div>

            {/* School Fees */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">School Fees</h3>
              <p className="text-muted-foreground text-sm mb-4">
                View outstanding fees and access school banking details for payments.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Check balance
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  View payment history
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Bank details
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/profile">View Fees</Link>
              </Button>
            </div>

            {/* Dashboard Access */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">My Dashboard</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Access your personalized dashboard with learning materials and resources.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Learning materials
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Announcements
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Quizzes & tests
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => redirectToDashboard()}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
      {/* Hero with Image */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={schoolTrophy}
            alt="School achievements"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <span className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
              User Portal
            </span>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold mb-4">
              Student Portal
            </h1>
            <p className="text-white/90">
              Access your personal information and view academic reports.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading...</p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </section>
    </Layout>
  );
}