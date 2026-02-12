import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AppRole = "learner" | "teacher" | "grade_head" | "principal" | "admin" | "hod" | "llc" | "finance" | "librarian";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  id_number: string | null;
  grade: string | null;
  class: string | null;
  avatar_url: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
}

interface Registration {
  id: string;
  status: string;
  role: AppRole;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  registration: Registration | null;
  loading: boolean;
  dataLoaded: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; role: AppRole; phone?: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user?: User | null }>;
  signOut: () => Promise<void>;
  isApproved: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  const fetchUserData = useCallback(async (userId: string) => {
    setDataLoaded(false);
    
    try {
      // Fetch all data in parallel
      const [profileRes, roleRes, regRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("registrations").select("id, status, role, first_name, last_name").eq("user_id", userId).maybeSingle()
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      if (roleRes.data) {
        setRole(roleRes.data.role as AppRole);
      } else {
        setRole(null);
      }

      if (regRes.data) {
        setRegistration(regRes.data as Registration);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          setProfile(null);
          setRole(null);
          setRegistration(null);
          setDataLoaded(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; role: AppRole; phone?: string }
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "Account Created!",
      description: "Your registration is pending approval. You'll be notified once approved.",
    });

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error, user: null };
      }

      // Fetch user data immediately after sign in
      if (data.user) {
        await fetchUserData(data.user.id);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: "Unable to connect to the server. Please check your internet connection and try again.",
        variant: "destructive",
      });
      return { error: err, user: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setRegistration(null);
    setDataLoaded(false);
  };

  const isApproved = registration?.status === "approved" && role !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        registration,
        loading,
        dataLoaded,
        signUp,
        signIn,
        signOut,
        isApproved,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper hook to redirect based on role
export function useRoleRedirect() {
  const { role, isApproved, loading, registration, user, dataLoaded } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectToDashboard = useCallback((showWelcome = false) => {
    // Wait for data to be loaded
    if (!dataLoaded) {
      return false;
    }

    // Show welcome message if requested
    if (showWelcome && registration) {
      const displayName = [registration.first_name, registration.last_name].filter(Boolean).join(" ");
      toast({
        title: `Welcome ${displayName || "back"}!`,
        description: "Signing you in and loading your dashboard...",
      });
    }

    // If not approved yet (or role not assigned yet), always go to the pending dashboard
    if (!isApproved || !role) {
      navigate("/dashboard/pending");
      return true;
    }

    // Redirect based on role
    switch (role) {
      case "learner":
        navigate("/dashboard/learner");
        break;
      case "teacher":
        navigate("/dashboard/teacher");
        break;
      case "grade_head":
        navigate("/dashboard/grade-head");
        break;
      case "hod":
        navigate("/dashboard/hod");
        break;
      case "llc":
        navigate("/dashboard/llc");
        break;
      case "principal":
        navigate("/dashboard/principal");
        break;
      case "admin":
        navigate("/dashboard/admin");
        break;
      case "finance":
        navigate("/dashboard/finance");
        break;
      case "librarian":
        navigate("/dashboard/librarian");
        break;
      default:
        navigate("/dashboard/pending");
    }
    return true;
  }, [role, isApproved, dataLoaded, registration, navigate, toast]);

  return { redirectToDashboard, role, isApproved, loading, registration, dataLoaded };
}
