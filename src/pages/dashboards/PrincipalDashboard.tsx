import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, Users, BarChart3, Star, MessageSquare, Send,
  TrendingUp, TrendingDown, School, Bell, ChevronRight, Loader2,
  AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Registration {
  id: string;
  role: string;
  status: string;
  grade: string | null;
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
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [staffMessage, setStaffMessage] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [complaintResponse, setComplaintResponse] = useState("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const tabs = [
    { id: "overview", label: "School Overview", icon: School },
    { id: "grades", label: "Grade Performance", icon: BarChart3 },
    { id: "complaints", label: "Complaints", icon: AlertTriangle },
    { id: "staff", label: "Staff Overview", icon: Users },
    { id: "communicate", label: "Communication", icon: MessageSquare },
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

  const sendStaffMessage = async () => {
    if (!staffMessage.trim()) return;
    try {
      await supabase.from('announcements').insert({
        title: `Message from Principal`,
        content: staffMessage,
        type: 'announcement',
        created_by: user?.id,
        target_audience: selectedStaff.length > 0 ? selectedStaff : ['teachers', 'grade_heads', 'admin'],
      });
      toast({ title: "Message Sent", description: `Your message has been sent to ${selectedStaff.length || "all"} staff members.` });
      setStaffMessage("");
      setSelectedStaff([]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleRespondComplaint = async (complaintId: string) => {
    if (!complaintResponse.trim()) return;
    const { error } = await supabase.from('complaints').update({
      status: 'resolved',
      response: complaintResponse,
      responded_by: user?.id,
    }).eq('id', complaintId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Response Sent", description: "The complaint has been resolved." });
      setComplaintResponse("");
      setRespondingTo(null);
      fetchData();
    }
  };

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
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm text-muted-foreground">Total Learners</p><p className="text-3xl font-bold text-foreground">{learnerCount}</p></div>
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm text-muted-foreground">Teaching Staff</p><p className="text-3xl font-bold text-foreground">{teacherCount + gradeHeadCount}</p></div>
                        <School className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm text-muted-foreground">School Average</p><p className="text-3xl font-bold text-foreground">67%</p></div>
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm text-muted-foreground">Pending Complaints</p><p className="text-3xl font-bold text-destructive">{pendingComplaints}</p></div>
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Grade Performance Summary</h3>
                    <div className="space-y-4">
                      {gradePerformance.map((grade) => (
                        <div key={grade.grade} className="flex items-center gap-4">
                          <span className="w-20 font-medium text-foreground text-sm">{grade.grade}</span>
                          <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${grade.passRate >= 85 ? "bg-primary" : grade.passRate >= 70 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${grade.passRate}%` }} />
                          </div>
                          <span className="w-16 text-right text-sm text-muted-foreground">{grade.passRate}%</span>
                          {grade.trend === "up" ? <TrendingUp className="w-4 h-4 text-primary" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Grades */}
              {activeTab === "grades" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Detailed Grade Performance</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradePerformance.map((grade) => (
                      <div key={grade.grade} className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-heading text-lg font-semibold text-foreground">{grade.grade}</h3>
                          {grade.trend === "up" ? <span className="flex items-center gap-1 text-primary text-sm"><TrendingUp className="w-4 h-4" /> Improving</span> : <span className="flex items-center gap-1 text-destructive text-sm"><TrendingDown className="w-4 h-4" /> Declining</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div><p className="text-2xl font-bold text-foreground">{grade.students || 0}</p><p className="text-xs text-muted-foreground">Students</p></div>
                          <div><p className="text-2xl font-bold text-foreground">{grade.average}%</p><p className="text-xs text-muted-foreground">Average</p></div>
                          <div><p className={`text-2xl font-bold ${grade.passRate >= 85 ? "text-primary" : "text-accent"}`}>{grade.passRate}%</p><p className="text-xs text-muted-foreground">Pass Rate</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complaints */}
              {activeTab === "complaints" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Student Complaints</h2>
                  {complaints.length === 0 ? (
                    <div className="glass-card p-8 text-center text-muted-foreground">No complaints received yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {complaints.map((c) => {
                        const learner = profiles[c.learner_id];
                        return (
                          <div key={c.id} className="glass-card p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-foreground">
                                  {c.is_anonymous ? `Anonymous (${c.grade})` : learner ? `${learner.first_name} ${learner.last_name} (${c.grade})` : c.grade}
                                </p>
                                {c.subject && <p className="text-sm text-muted-foreground">Subject: {c.subject}</p>}
                                <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                c.status === "pending" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                              }`}>
                                {c.status === "pending" ? <Clock className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                                {c.status}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mb-3">{c.complaint_text}</p>
                            
                            {c.response && (
                              <div className="p-3 rounded bg-primary/5 border border-primary/20 mb-3">
                                <p className="text-xs font-medium text-primary">Response:</p>
                                <p className="text-sm text-muted-foreground">{c.response}</p>
                              </div>
                            )}

                            {c.status === "pending" && (
                              <div className="space-y-2">
                                {respondingTo === c.id ? (
                                  <>
                                    <Textarea value={complaintResponse} onChange={(e) => setComplaintResponse(e.target.value)} placeholder="Type your response..." rows={3} />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => handleRespondComplaint(c.id)}>
                                        <Send className="w-4 h-4 mr-1" /> Send Response
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setComplaintResponse(""); }}>Cancel</Button>
                                    </div>
                                  </>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => setRespondingTo(c.id)}>
                                    <MessageSquare className="w-4 h-4 mr-1" /> Respond
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Staff */}
              {activeTab === "staff" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Staff Overview</h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="glass-card p-6 text-center"><p className="text-3xl font-bold text-foreground">{teacherCount}</p><p className="text-sm text-muted-foreground">Teachers</p></div>
                    <div className="glass-card p-6 text-center"><p className="text-3xl font-bold text-foreground">{gradeHeadCount}</p><p className="text-sm text-muted-foreground">Grade Heads</p></div>
                    <div className="glass-card p-6 text-center"><p className="text-3xl font-bold text-foreground">{registrations.filter(r => r.role === 'admin').length}</p><p className="text-sm text-muted-foreground">Administrators</p></div>
                  </div>
                </div>
              )}

              {/* Communication */}
              {activeTab === "communicate" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Staff Communication</h2>
                  <div className="glass-card p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Select Recipients</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "All Staff", value: [] },
                          { label: "Teachers", value: ["teachers"] },
                          { label: "Grade Heads", value: ["grade_heads"] },
                          { label: "Admin", value: ["admin"] },
                        ].map((opt) => (
                          <Button
                            key={opt.label}
                            variant={JSON.stringify(selectedStaff) === JSON.stringify(opt.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedStaff(opt.value)}
                          >{opt.label}</Button>
                        ))}
                      </div>
                    </div>
                    <Textarea value={staffMessage} onChange={(e) => setStaffMessage(e.target.value)} placeholder="Type your message..." rows={4} />
                    <Button onClick={sendStaffMessage} className="w-full">
                      <Send className="w-4 h-4 mr-2" /> Send Message
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
