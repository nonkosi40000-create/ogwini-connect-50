import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  User, Users, BarChart3, Star, MessageSquare,
  School, Loader2, AlertTriangle, Calendar, FileText, Briefcase
} from "lucide-react";
import { TeacherRatingsView } from "@/components/dashboard/TeacherRatingsView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PrincipalOverview } from "@/components/dashboard/principal/PrincipalOverview";
import { AcademicPerformance } from "@/components/dashboard/principal/AcademicPerformance";
import { StaffManagement } from "@/components/dashboard/principal/StaffManagement";
import { MeetingCoordination } from "@/components/dashboard/principal/MeetingCoordination";
import { GovernanceReports } from "@/components/dashboard/principal/GovernanceReports";
import { PrincipalComplaints } from "@/components/dashboard/principal/PrincipalComplaints";
import { PrincipalCommunication } from "@/components/dashboard/principal/PrincipalCommunication";

interface Registration {
  id: string;
  role: string;
  status: string;
  grade: string | null;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | null;
  phone: string | null;
  user_id: string | null;
}

interface Complaint {
  id: string;
  learner_id: string;
  grade: string;
  subject: string | null;
  complaint_text: string;
  is_anonymous: boolean;
  status: string;
  response: string | null;
  created_at: string;
}

export default function PrincipalDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  const tabs = [
    { id: "overview", label: "Overview", icon: School },
    { id: "academics", label: "Academics", icon: BarChart3 },
    { id: "staff", label: "Staff", icon: Briefcase },
    { id: "ratings", label: "Ratings", icon: Star },
    { id: "complaints", label: "Complaints", icon: AlertTriangle },
    { id: "meetings", label: "Meetings", icon: Calendar },
    { id: "governance", label: "Governance", icon: FileText },
    { id: "communicate", label: "Communicate", icon: MessageSquare },
  ];

  const fetchData = async () => {
    setLoading(true);
    const [regRes, complaintsRes, profilesRes] = await Promise.all([
      supabase.from('registrations').select('*').eq('status', 'approved'),
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, first_name, last_name, grade'),
    ]);

    if (regRes.data) setRegistrations(regRes.data);
    if (complaintsRes.data) setComplaints(complaintsRes.data as Complaint[]);

    const profileMap: Record<string, any> = {};
    if (profilesRes.data) profilesRes.data.forEach((p) => { profileMap[p.user_id] = p; });
    setProfiles(profileMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const learnerCount = registrations.filter(r => r.role === 'learner').length;
  const teacherCount = registrations.filter(r => r.role === 'teacher').length;
  const gradeHeadCount = registrations.filter(r => r.role === 'grade_head').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;

  const gradePerformance = [
    { grade: "Grade 8", students: registrations.filter(r => r.grade === 'Grade 8').length, average: 68, passRate: 88, trend: "up" },
    { grade: "Grade 9", students: registrations.filter(r => r.grade === 'Grade 9').length, average: 65, passRate: 82, trend: "down" },
    { grade: "Grade 10", students: registrations.filter(r => r.grade === 'Grade 10').length, average: 62, passRate: 79, trend: "up" },
    { grade: "Grade 11", students: registrations.filter(r => r.grade === 'Grade 11').length, average: 69, passRate: 84, trend: "up" },
    { grade: "Grade 12", students: registrations.filter(r => r.grade === 'Grade 12').length, average: 72, passRate: 91, trend: "up" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="text-white">
                <h1 className="font-heading text-3xl font-bold">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'Principal'}
                </h1>
                <p className="text-white/80 text-lg">Principal • Ogwini Comprehensive Technical High School</p>
              </div>
              {pendingComplaints > 0 && (
                <div className="ml-auto px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                  {pendingComplaints} Complaints
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "complaints" && pendingComplaints > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs">{pendingComplaints}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <PrincipalOverview
                  learnerCount={learnerCount}
                  teacherCount={teacherCount}
                  gradeHeadCount={gradeHeadCount}
                  pendingComplaints={pendingComplaints}
                  gradePerformance={gradePerformance}
                />
              )}

              {activeTab === "academics" && (
                <AcademicPerformance gradePerformance={gradePerformance} />
              )}

              {activeTab === "staff" && (
                <StaffManagement registrations={registrations} onRefresh={fetchData} />
              )}

              {activeTab === "ratings" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Teacher Ratings</h2>
                  <p className="text-sm text-muted-foreground">Anonymous learner feedback aggregated across all teachers</p>
                  <TeacherRatingsView />
                </div>
              )}

              {activeTab === "complaints" && (
                <PrincipalComplaints complaints={complaints} profiles={profiles} onRefresh={fetchData} />
              )}

              {activeTab === "meetings" && (
                <MeetingCoordination />
              )}

              {activeTab === "governance" && (
                <GovernanceReports registrations={registrations} gradePerformance={gradePerformance} />
              )}

              {activeTab === "communicate" && (
                <PrincipalCommunication />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
