import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth, useRoleRedirect } from "@/hooks/useAuth";
import { CheckCircle, Clock, XCircle, LogOut, ArrowRight, LayoutDashboard } from "lucide-react";

export default function PendingDashboard() {
  const { user, registration, loading, isApproved, role, signOut } = useAuth();
  const { redirectToDashboard } = useRoleRedirect();
  const navigate = useNavigate();

  const firstName = (user?.user_metadata as any)?.first_name as string | undefined;
  const displayName = firstName || user?.email || "there";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (!loading && user && isApproved && role) {
      redirectToDashboard();
    }
  }, [loading, user, isApproved, role]);

  return (
    <Layout>
      <main className="container mx-auto px-4 py-10">
        <header className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {displayName}</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading your account...</p>
          </div>
        ) : !user ? (
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-6">Please sign in to access your dashboard.</p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        ) : isApproved && role ? (
          <div className="max-w-3xl mx-auto bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
              Your account is active.
            </h2>
            <p className="text-muted-foreground mb-6">Taking you to your dashboard...</p>
          </div>
        ) : registration?.status === "declined" ? (
          <div className="max-w-3xl mx-auto bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
              Registration declined
            </h2>
            <p className="text-muted-foreground mb-6">
              Please contact the school administration for help.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button asChild>
                <Link to="/portal">
                  Go to Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-accent/10 border border-accent/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
              Registration pending approval
            </h2>
            <p className="text-muted-foreground mb-2">
              You can use the portal to view and update your personal information.
            </p>
            {registration?.role ? (
              <p className="text-sm text-muted-foreground mb-6">
                Requested role: <span className="font-semibold text-accent capitalize">{registration.role.replace("_", " ")}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">
                We are still processing your registration.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/portal">
                  Go to Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
