import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import RegistrationPage from "./pages/RegistrationPage";
import AcademicsPage from "./pages/AcademicsPage";
import MerchandisePage from "./pages/MerchandisePage";
import PortalPage from "./pages/PortalPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserProfilePage from "./pages/UserProfilePage";
import LearnerDashboard from "./pages/dashboards/LearnerDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import GradeHeadDashboard from "./pages/dashboards/GradeHeadDashboard";
import HODDashboard from "./pages/dashboards/HODDashboard";
import LLCDashboard from "./pages/dashboards/LLCDashboard";
import PrincipalDashboard from "./pages/dashboards/PrincipalDashboard";
import DeputyPrincipalDashboard from "./pages/dashboards/DeputyPrincipalDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import PendingDashboard from "./pages/dashboards/PendingDashboard";
import FinanceDashboard from "./pages/dashboards/FinanceDashboard";
import LibrarianDashboard from "./pages/dashboards/LibrarianDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="/merchandise" element={<MerchandisePage />} />
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/signup" element={<Navigate to="/registration" replace />} />
            
            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute requireApproval={false}>
                <UserProfilePage />
              </ProtectedRoute>
            } />

            <Route
              path="/dashboard/pending"
              element={
                <ProtectedRoute requireApproval={false}>
                  <PendingDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard/learner" element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <LearnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/grade-head" element={
              <ProtectedRoute allowedRoles={["grade_head"]}>
                <GradeHeadDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/hod" element={
              <ProtectedRoute allowedRoles={["hod"]}>
                <HODDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/llc" element={
              <ProtectedRoute allowedRoles={["llc"]}>
                <LLCDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/principal" element={
              <ProtectedRoute allowedRoles={["principal"]}>
                <PrincipalDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/deputy-principal" element={
              <ProtectedRoute allowedRoles={["deputy_principal"]}>
                <DeputyPrincipalDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/finance" element={
              <ProtectedRoute allowedRoles={["finance"]}>
                <FinanceDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/librarian" element={
              <ProtectedRoute allowedRoles={["librarian"]}>
                <LibrarianDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
