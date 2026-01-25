import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

type AppRole = "learner" | "teacher" | "grade_head" | "principal" | "admin" | "hod" | "llc";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  /** When true, user must be approved (role assigned) to access this route. */
  requireApproval?: boolean;
}

const roleToDashboardPath = (role: AppRole) => {
  switch (role) {
    case "learner":
      return "/dashboard/learner";
    case "teacher":
      return "/dashboard/teacher";
    case "grade_head":
      return "/dashboard/grade-head";
    case "hod":
      return "/dashboard/hod";
    case "llc":
      return "/dashboard/llc";
    case "principal":
      return "/dashboard/principal";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/pending";
  }
};

export function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = true,
}: ProtectedRouteProps) {
  const { user, loading, role, isApproved, registration } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Approval gate (used for role dashboards)
  if (requireApproval && !isApproved) {
    return <Navigate to="/dashboard/pending" replace />;
  }

  const effectiveRole = (role ?? registration?.role ?? null) as AppRole | null;

  // Check role if specified
  if (allowedRoles) {
    if (!effectiveRole) {
      return <Navigate to="/dashboard/pending" replace />;
    }

    if (!allowedRoles.includes(effectiveRole)) {
      return <Navigate to={roleToDashboardPath(effectiveRole)} replace />;
    }
  }

  return <>{children}</>;
}

