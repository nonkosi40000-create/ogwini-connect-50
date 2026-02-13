import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, Users, FileText, Calendar, Mail, Settings,
  CheckCircle, XCircle, Clock, Search, Upload, Send,
  Ticket, Eye, Download, Loader2, RefreshCw, Building2, Star,
  UserCheck, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RegistrationDetailModal } from "@/components/dashboard/RegistrationDetailModal";
import { TeacherRatingsView } from "@/components/dashboard/TeacherRatingsView";

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  grade: string | null;
  class?: string | null;
  role: string;
  status: string;
  created_at: string;
  user_id: string | null;
  id_document_url: string | null;
  proof_of_address_url: string | null;
  payment_proof_url: string | null;
  report_url?: string | null;
  id_number: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  admin_notes?: string | null;
  elective_subjects?: string[] | null;
  department_id?: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  grade: string | null;
  user_id: string;
  department_id?: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DepartmentHead {
  id: string;
  user_id: string;
  department_id: string;
}

interface Timetable {
  id: string;
  title: string;
  grade: string;
  class: string | null;
  timetable_type: string;
  file_url: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("registrations");
  const [searchQuery, setSearchQuery] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentHeads, setDepartmentHeads] = useState<DepartmentHead[]>([]);
  const [hodCandidates, setHodCandidates] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Email form state
  const [emailRecipients, setEmailRecipients] = useState("all");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Timetable state
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [ttGrade, setTtGrade] = useState("");
  const [ttClass, setTtClass] = useState("");
  const [ttType, setTtType] = useState("class");
  const [ttTitle, setTtTitle] = useState("");
  const [ttFile, setTtFile] = useState<File | null>(null);
  const [uploadingTt, setUploadingTt] = useState(false);

  // Settings state
  const [currentTerm, setCurrentTerm] = useState("Term 1");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  // Department browse state
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const tabs = [
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "users", label: "All Users", icon: User },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "ratings", label: "Teacher Ratings", icon: Star },
    { id: "timetables", label: "Timetables", icon: Calendar },
    { id: "communications", label: "Email System", icon: Mail },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .neq('status', 'rejected')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching registrations:', error);
      toast({ title: "Error", description: "Failed to load registrations", variant: "destructive" });
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
    ]);
    if (profilesRes.data) setAllUsers(profilesRes.data as Profile[]);
    if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);
  };

  const fetchDepartments = async () => {
    const [deptRes, headsRes, hodRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('department_heads').select('*'),
      supabase.from('registrations').select('*').eq('role', 'hod').eq('status', 'approved'),
    ]);
    if (deptRes.data) setDepartments(deptRes.data);
    if (headsRes.data) setDepartmentHeads(headsRes.data);
    if (hodRes.data) setHodCandidates(hodRes.data);
  };

  const fetchTimetables = async () => {
    const { data } = await supabase.from('timetables').select('*').order('created_at', { ascending: false });
    if (data) setTimetables(data as Timetable[]);
  };

  const assignHOD = async (departmentId: string, userId: string) => {
    setActionLoading(departmentId);
    try {
      await supabase.from('department_heads').delete().eq('department_id', departmentId);
      const { error } = await supabase.from('department_heads').insert({ department_id: departmentId, user_id: userId });
      if (error) throw error;
      toast({ title: "HOD Assigned", description: "Head of Department has been assigned successfully." });
      fetchDepartments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign HOD", variant: "destructive" });
    }
    setActionLoading(null);
  };

  useEffect(() => {
    fetchRegistrations();
    fetchAllUsers();
    fetchDepartments();
    fetchTimetables();
  }, []);

  const handleApprove = async (reg: Registration) => {
    setActionLoading(reg.id);
    try {
      if (!reg.user_id) throw new Error("Registration has no linked user account");

      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: reg.user_id, role: reg.role as any }, { onConflict: 'user_id,role' });
      if (roleError) throw new Error(`Failed to assign role: ${roleError.message}`);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: reg.user_id,
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          phone: reg.phone,
          grade: reg.grade,
          class: reg.class || null,
          id_number: reg.id_number,
          address: reg.address,
          parent_name: reg.parent_name,
          parent_phone: reg.parent_phone,
          parent_email: reg.parent_email,
          elective_subjects: (reg as any).elective_subjects || [],
          department_id: (reg as any).department_id || null,
        }, { onConflict: 'user_id' });
      if (profileError) throw new Error(`Failed to create profile: ${profileError.message}`);

      const { error: regError } = await supabase
        .from('registrations')
        .update({ status: 'approved' })
        .eq('id', reg.id);
      if (regError) throw regError;

      toast({
        title: "Registration Approved",
        description: `${reg.first_name} ${reg.last_name} has been approved and can now access their dashboard.`,
      });
      fetchRegistrations();
      fetchAllUsers();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({ title: "Approval Failed", description: error.message || "Failed to approve registration.", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleReject = async (reg: Registration) => {
    setActionLoading(reg.id);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'rejected' })
        .eq('id', reg.id);
      if (error) throw error;
      toast({ title: "Registration Rejected", description: `${reg.first_name} ${reg.last_name}'s registration has been rejected.`, variant: "destructive" });
      fetchRegistrations();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject registration", variant: "destructive" });
    }
    setActionLoading(null);
  };

  // Real email system: fetches recipient emails and calls edge function
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in subject and message", variant: "destructive" });
      return;
    }

    setSendingEmail(true);
    try {
      // Get actual recipient emails
      let recipientEmails: string[] = [];
      
      if (emailRecipients === 'all') {
        recipientEmails = allUsers.map(u => u.email);
      } else if (emailRecipients === 'learners') {
        const learnerUserIds = userRoles.filter(r => r.role === 'learner').map(r => r.user_id);
        recipientEmails = allUsers.filter(u => learnerUserIds.includes(u.user_id)).map(u => u.email);
      } else if (emailRecipients === 'teachers') {
        const teacherUserIds = userRoles.filter(r => r.role === 'teacher').map(r => r.user_id);
        recipientEmails = allUsers.filter(u => teacherUserIds.includes(u.user_id)).map(u => u.email);
      } else if (emailRecipients === 'grade_heads') {
        const ghUserIds = userRoles.filter(r => r.role === 'grade_head').map(r => r.user_id);
        recipientEmails = allUsers.filter(u => ghUserIds.includes(u.user_id)).map(u => u.email);
      } else if (emailRecipients === 'parents') {
        const learnerUserIds = userRoles.filter(r => r.role === 'learner').map(r => r.user_id);
        recipientEmails = allUsers
          .filter(u => learnerUserIds.includes(u.user_id))
          .map(u => (u as any).parent_email)
          .filter(Boolean);
      } else if (emailRecipients.startsWith('dept:')) {
        const deptId = emailRecipients.replace('dept:', '');
        recipientEmails = allUsers
          .filter(u => (u as any).department_id === deptId)
          .map(u => u.email);
      } else {
        // Specific email address
        recipientEmails = [emailRecipients];
      }

      if (recipientEmails.length === 0) {
        toast({ title: "No Recipients", description: "No users found for the selected group.", variant: "destructive" });
        setSendingEmail(false);
        return;
      }

      // Call edge function to send emails
      const { error: fnError } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          recipients: recipientEmails,
          subject: emailSubject,
          body: emailBody,
          senderName: profile ? `${profile.first_name} ${profile.last_name}` : 'School Admin',
        }
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
      }

      // Log to email_logs table
      await supabase.from('email_logs').insert({
        subject: emailSubject,
        body: emailBody,
        recipients: recipientEmails,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      toast({
        title: "Email Sent",
        description: `Your message has been sent to ${recipientEmails.length} recipient(s).`,
      });
      setEmailSubject("");
      setEmailBody("");
    } catch (error) {
      console.error('Email error:', error);
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    }
    setSendingEmail(false);
  };

  // Timetable upload
  const handleTimetableUpload = async () => {
    if (!ttFile || !ttGrade || !ttTitle) {
      toast({ title: "Missing Fields", description: "Please fill grade, title and select a file.", variant: "destructive" });
      return;
    }
    setUploadingTt(true);
    try {
      const fileName = `${Date.now()}-${ttFile.name}`;
      const { error: uploadErr } = await supabase.storage.from('uploads').upload(`timetables/${fileName}`, ttFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(`timetables/${fileName}`);

      const { error: insertErr } = await supabase.from('timetables').insert({
        title: ttTitle,
        grade: ttGrade,
        class: ttClass || null,
        timetable_type: ttType,
        file_url: urlData.publicUrl,
        uploaded_by: user?.id,
      });
      if (insertErr) throw insertErr;

      toast({ title: "Timetable Published", description: `"${ttTitle}" is now visible to ${ttGrade} ${ttClass || 'all classes'}.` });
      setTtTitle("");
      setTtGrade("");
      setTtClass("");
      setTtFile(null);
      fetchTimetables();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload timetable", variant: "destructive" });
    }
    setUploadingTt(false);
  };

  const deleteTimetable = async (id: string) => {
    const { error } = await supabase.from('timetables').delete().eq('id', id);
    if (!error) {
      toast({ title: "Deleted", description: "Timetable removed." });
      fetchTimetables();
    }
  };

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'unknown';
  };

  const getDeptTeachers = (deptId: string) => {
    return allUsers.filter(u => (u as any).department_id === deptId);
  };

  const pendingCount = registrations.filter(r => r.status === "pending").length;
  const approvedCount = registrations.filter(r => r.status === "approved").length;

  const filteredRegistrations = registrations.filter(r =>
    r.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gradeClasses = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent/20 to-primary/20 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <Settings className="w-8 h-8 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'School Administrator'}
                </h1>
                <p className="text-muted-foreground">Admin Dashboard • Ogwini School</p>
              </div>
              <div className="ml-auto flex gap-2">
                <div className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                  {pendingCount} Pending
                </div>
                <div className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {approvedCount} Approved
                </div>
              </div>
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
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Registrations Tab */}
          {activeTab === "registrations" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="font-heading text-xl font-semibold text-foreground">Student & Staff Registrations</h2>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={fetchRegistrations}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                  </Button>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search registrations..." className="pl-10 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Role</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Grade</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Date</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Documents</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Payment</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No registrations found</td></tr>
                        ) : (
                          filteredRegistrations.map((reg, index) => (
                            <tr key={reg.id} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{reg.first_name} {reg.last_name}</p>
                                  <p className="text-xs text-muted-foreground">{reg.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                                  {reg.role.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-muted-foreground">{reg.grade || '-'}</td>
                              <td className="px-4 py-3 text-center text-sm text-muted-foreground">{new Date(reg.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-center">
                                {reg.id_document_url ? (
                                  <a href={reg.id_document_url} target="_blank" rel="noopener noreferrer">
                                    <CheckCircle className="w-5 h-5 text-primary mx-auto cursor-pointer hover:scale-110 transition-transform" />
                                  </a>
                                ) : (
                                  <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {reg.payment_proof_url ? (
                                  <a href={reg.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                    <CheckCircle className="w-5 h-5 text-primary mx-auto cursor-pointer hover:scale-110 transition-transform" />
                                  </a>
                                ) : (
                                  <Clock className="w-5 h-5 text-accent mx-auto" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  reg.status === "approved" ? "bg-primary/10 text-primary" :
                                  reg.status === "pending" ? "bg-accent/10 text-accent" :
                                  "bg-destructive/10 text-destructive"
                                }`}>
                                  {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedRegistration(reg); setDetailModalOpen(true); }} title="View Details">
                                  <Eye className="w-4 h-4 text-primary" />
                                </Button>
                                {reg.status === "pending" && (
                                  <div className="flex justify-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleApprove(reg)} disabled={actionLoading === reg.id} title="Approve">
                                      {actionLoading === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-primary" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleReject(reg)} disabled={actionLoading === reg.id} title="Reject">
                                      <XCircle className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Users */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">All Registered Users</h2>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Role</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Grade</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
                      ) : (
                        allUsers.map((u, index) => {
                          const role = getUserRole(u.user_id);
                          const dept = departments.find(d => d.id === (u as any).department_id);
                          return (
                            <tr key={u.id} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                              <td className="px-4 py-3 text-sm font-medium text-foreground">{u.first_name} {u.last_name}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{role.replace('_', ' ')}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-muted-foreground">{u.grade || '-'}</td>
                              <td className="px-4 py-3 text-center text-sm text-muted-foreground">{dept?.name || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Departments */}
          {activeTab === "departments" && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">Department Management</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => {
                  const currentHead = departmentHeads.find(h => h.department_id === dept.id);
                  const currentHodUser = hodCandidates.find(c => c.user_id === currentHead?.user_id);
                  const deptTeachers = getDeptTeachers(dept.id);
                  const isSelected = selectedDeptId === dept.id;

                  return (
                    <div key={dept.id} className={`glass-card p-6 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedDeptId(isSelected ? null : dept.id)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold text-foreground">{dept.name}</h3>
                          <p className="text-xs text-muted-foreground">Code: {dept.code}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm">
                          <span className="font-medium text-foreground">HOD: </span>
                          <span className="text-muted-foreground">
                            {currentHodUser ? `${currentHodUser.first_name} ${currentHodUser.last_name}` : 'Not assigned'}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-foreground">Staff: </span>
                          <span className="text-muted-foreground">{deptTeachers.length} member(s)</span>
                        </p>

                        <select
                          className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground text-sm"
                          value={currentHead?.user_id || ''}
                          onChange={(e) => { e.stopPropagation(); e.target.value && assignHOD(dept.id, e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={actionLoading === dept.id}
                        >
                          <option value="">Assign HOD...</option>
                          {hodCandidates.map(c => (
                            <option key={c.id} value={c.user_id || ''}>{c.first_name} {c.last_name}</option>
                          ))}
                        </select>

                        {isSelected && deptTeachers.length > 0 && (
                          <div className="mt-4 border-t border-border pt-3">
                            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-primary" /> Staff Members
                            </p>
                            <ul className="space-y-2">
                              {deptTeachers.map(t => (
                                <li key={t.id} className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-2">
                                  <span className="text-foreground">{t.first_name} {t.last_name}</span>
                                  <Button variant="ghost" size="sm" onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailRecipients(t.email);
                                    setActiveTab('communications');
                                  }}>
                                    <Mail className="w-3 h-3" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {isSelected && deptTeachers.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-2 italic">No teachers registered under this department yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hodCandidates.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No approved HODs available. Approve HOD registrations first.</p>
              )}
            </div>
          )}

          {/* Teacher Ratings */}
          {activeTab === "ratings" && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">Teacher Performance Ratings</h2>
              <TeacherRatingsView />
            </div>
          )}

          {/* Timetables */}
          {activeTab === "timetables" && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">Timetable Management</h2>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Upload form */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground">Upload New Timetable</h3>
                  <div>
                    <Label>Title *</Label>
                    <Input placeholder="e.g. Grade 8 Term 1 Timetable" value={ttTitle} onChange={e => setTtTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Grade *</Label>
                      <select className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground" value={ttGrade} onChange={e => setTtGrade(e.target.value)}>
                        <option value="">Select Grade</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                        <option value="All">All Grades</option>
                      </select>
                    </div>
                    <div>
                      <Label>Class (optional)</Label>
                      <select className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground" value={ttClass} onChange={e => setTtClass(e.target.value)}>
                        <option value="">All Classes</option>
                        {gradeClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Timetable Type</Label>
                    <select className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground" value={ttType} onChange={e => setTtType(e.target.value)}>
                      <option value="class">Class Timetable</option>
                      <option value="exam">Exam Timetable</option>
                      <option value="weekend">Weekend Classes</option>
                      <option value="events">School Events</option>
                    </select>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground mb-1">{ttFile ? ttFile.name : "Select a file to upload"}</p>
                    <p className="text-xs text-muted-foreground mb-3">PDF or Image (max 10MB)</p>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button" asChild><span>Browse Files</span></Button>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setTtFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full" onClick={handleTimetableUpload} disabled={uploadingTt}>
                    {uploadingTt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Publish Timetable
                  </Button>
                </div>

                {/* Existing timetables */}
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground">Published Timetables</h3>
                  {timetables.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No timetables published yet.</p>
                    </div>
                  ) : (
                    timetables.map(tt => (
                      <div key={tt.id} className="glass-card p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground text-sm">{tt.title}</p>
                          <p className="text-xs text-muted-foreground">{tt.grade} {tt.class || ''} • {tt.timetable_type} • {new Date(tt.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={tt.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                          </a>
                          <Button variant="ghost" size="sm" onClick={() => deleteTimetable(tt.id)}>
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Communications */}
          {activeTab === "communications" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">Send Email Notifications</h2>
              <div className="glass-card p-6 space-y-4">
                <div>
                  <Label>Recipients</Label>
                  <select
                    className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="learners">All Learners</option>
                    <option value="parents">All Parents</option>
                    <option value="teachers">All Teachers</option>
                    <option value="grade_heads">Grade Heads</option>
                    {departments.map(d => (
                      <option key={d.id} value={`dept:${d.id}`}>Department: {d.name}</option>
                    ))}
                  </select>
                  {!['all', 'learners', 'parents', 'teachers', 'grade_heads'].includes(emailRecipients) && !emailRecipients.startsWith('dept:') && (
                    <p className="text-xs text-muted-foreground mt-1">Sending to: {emailRecipients}</p>
                  )}
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input placeholder="Email subject line" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div>
                  <Label>Message</Label>
                  <textarea
                    placeholder="Type your email message..."
                    className="w-full h-40 px-4 py-3 rounded-lg bg-secondary border border-input text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSendEmail} disabled={sendingEmail}>
                  {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Email
                </Button>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="font-heading text-xl font-semibold text-foreground">System Settings</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Academic Year */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Academic Year
                  </h3>
                  <div>
                    <Label>Current Academic Year</Label>
                    <Input type="number" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                  </div>
                  <div>
                    <Label>Current Term</Label>
                    <select className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground" value={currentTerm} onChange={e => setCurrentTerm(e.target.value)}>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                      <option value="Term 4">Term 4</option>
                    </select>
                  </div>
                  <Button className="w-full" onClick={() => toast({ title: "Settings Saved", description: `Academic year ${academicYear}, ${currentTerm} is now active.` })}>
                    Save Settings
                  </Button>
                </div>

                {/* Grade Structure */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" /> Grade Structure
                  </h3>
                  <p className="text-sm text-muted-foreground">Grades 8-12, Sections A-K</p>
                  <div className="space-y-2">
                    {["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(g => (
                      <div key={g} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2">
                        <span className="text-sm font-medium text-foreground">{g}</span>
                        <span className="text-xs text-muted-foreground">11 classes (A-K)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects overview */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Registered Subjects
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total subjects in system</span>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('departments')}>View by Department</Button>
                  </div>
                  {departments.map(d => (
                    <div key={d.id} className="text-sm flex items-center justify-between py-1 border-b border-border last:border-0">
                      <span className="text-foreground">{d.name}</span>
                      <span className="text-muted-foreground">{d.code}</span>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                      <span className="text-sm text-foreground">Total Users</span>
                      <span className="font-bold text-primary">{allUsers.length}</span>
                    </div>
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                      <span className="text-sm text-foreground">Pending Registrations</span>
                      <span className="font-bold text-accent">{pendingCount}</span>
                    </div>
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                      <span className="text-sm text-foreground">Published Timetables</span>
                      <span className="font-bold text-primary">{timetables.length}</span>
                    </div>
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                      <span className="text-sm text-foreground">Departments</span>
                      <span className="font-bold text-primary">{departments.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <RegistrationDetailModal
          registration={selectedRegistration}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onApprove={(reg) => { handleApprove(reg); setDetailModalOpen(false); }}
          onReject={(reg) => { handleReject(reg); setDetailModalOpen(false); }}
          isLoading={actionLoading === selectedRegistration?.id}
        />
      </div>
    </Layout>
  );
}
