import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  User, Users, BarChart3, AlertTriangle, Calendar, TrendingUp,
  TrendingDown, Loader2, BookOpen, FileText, Star, Search,
  Eye, Download, Bell, Clock, CheckCircle, Send, MessageSquare, School
} from "lucide-react";
import { TeacherRatingsView } from "@/components/dashboard/TeacherRatingsView";

// ─── Types ────────────────────────────────────────────────────
interface StudentProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  class: string | null;
  email: string;
}

interface MarkRecord {
  learner_id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  term: string | null;
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

const GRADES = ["8", "9", "10", "11", "12"];

export default function DeputyPrincipalDashboard() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Data
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintResponse, setComplaintResponse] = useState("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Filters
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const tabs = [
    { id: "overview", label: "Overview", icon: School },
    { id: "streams", label: "Stream Comparison", icon: BarChart3 },
    { id: "subjects", label: "Subject Analytics", icon: BookOpen },
    { id: "at-risk", label: "At-Risk Students", icon: AlertTriangle },
    { id: "timetables", label: "Timetables", icon: Calendar },
    { id: "complaints", label: "Complaints", icon: MessageSquare },
    { id: "ratings", label: "Teacher Ratings", icon: Star },
    { id: "communicate", label: "Communication", icon: Send },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, marksRes, ttRes, complaintsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name, grade, class, email").order("last_name"),
        supabase.from("marks").select("learner_id, subject, marks_obtained, total_marks, term"),
        supabase.from("timetables").select("*").order("created_at", { ascending: false }),
        supabase.from("complaints").select("*").order("created_at", { ascending: false }),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data as StudentProfile[]);
      if (marksRes.data) setMarks(marksRes.data as MarkRecord[]);
      if (ttRes.data) setTimetables(ttRes.data as Timetable[]);
      if (complaintsRes.data) setComplaints(complaintsRes.data as Complaint[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived Data ───────────────────────────────────────────
  const learners = students.filter(s => GRADES.some(g => s.grade === g || s.grade === `Grade ${g}`));
  const allSubjects = [...new Set(marks.map(m => m.subject))].sort();
  const pendingComplaints = complaints.filter(c => c.status === "pending").length;

  // Grade-level performance
  const gradeStats = GRADES.map(g => {
    const gradeLearners = learners.filter(s => s.grade === g || s.grade === `Grade ${g}`);
    const gradeStudentIds = gradeLearners.map(s => s.user_id);
    const gradeMarks = marks.filter(m => gradeStudentIds.includes(m.learner_id));
    const pcts = gradeMarks.map(m => (m.marks_obtained / m.total_marks) * 100);
    const avg = pcts.length > 0 ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : 0;
    const passRate = pcts.length > 0 ? Math.round((pcts.filter(p => p >= 50).length / pcts.length) * 100) : 0;
    const atRisk = new Set<string>();
    gradeStudentIds.forEach(sid => {
      const studentMarks = gradeMarks.filter(m => m.learner_id === sid);
      if (studentMarks.length > 0) {
        const studentAvg = studentMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / studentMarks.length;
        if (studentAvg < 50) atRisk.add(sid);
      }
    });
    return { grade: g, students: gradeLearners.length, average: avg, passRate, atRisk: atRisk.size, classes: [...new Set(gradeLearners.map(s => s.class).filter(Boolean))] as string[] };
  });

  // Class/stream comparison within a grade
  const selectedGradeStats = gradeFilter !== "all" ? gradeStats.find(g => g.grade === gradeFilter) : null;
  const streamComparison = selectedGradeStats
    ? selectedGradeStats.classes.map(cls => {
        const classStudents = learners.filter(s => (s.grade === gradeFilter || s.grade === `Grade ${gradeFilter}`) && s.class === cls);
        const classIds = classStudents.map(s => s.user_id);
        const classMarks = marks.filter(m => classIds.includes(m.learner_id));
        const pcts = classMarks.map(m => (m.marks_obtained / m.total_marks) * 100);
        const avg = pcts.length > 0 ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : 0;
        const passRate = pcts.length > 0 ? Math.round((pcts.filter(p => p >= 50).length / pcts.length) * 100) : 0;
        return { class: cls, students: classStudents.length, average: avg, passRate, assessments: classMarks.length };
      }).sort((a, b) => b.average - a.average)
    : [];

  // Subject performance
  const subjectPerformance = allSubjects.map(subj => {
    const subjectMarks = marks.filter(m => m.subject === subj);
    const pcts = subjectMarks.map(m => (m.marks_obtained / m.total_marks) * 100);
    const avg = pcts.length > 0 ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : 0;
    const passRate = pcts.length > 0 ? Math.round((pcts.filter(p => p >= 50).length / pcts.length) * 100) : 0;
    return { subject: subj, average: avg, passRate, count: subjectMarks.length };
  }).sort((a, b) => b.average - a.average);

  // At-risk students (below 50%)
  const atRiskStudents = learners.map(s => {
    const studentMarks = marks.filter(m => m.learner_id === s.user_id);
    if (studentMarks.length === 0) return null;
    const avg = studentMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / studentMarks.length;
    return { ...s, average: Math.round(avg * 10) / 10, assessments: studentMarks.length };
  }).filter(s => s !== null && s.average < 50).sort((a, b) => a!.average - b!.average) as (StudentProfile & { average: number; assessments: number })[];

  // School-wide totals
  const schoolAvg = marks.length > 0 ? Math.round((marks.reduce((s, m) => s + (m.marks_obtained / m.total_marks) * 100, 0) / marks.length) * 10) / 10 : 0;
  const schoolPassRate = marks.length > 0 ? Math.round((marks.filter(m => (m.marks_obtained / m.total_marks) * 100 >= 50).length / marks.length) * 100) : 0;

  // ─── Handlers ───────────────────────────────────────────────
  const handleRespondComplaint = async (complaintId: string) => {
    if (!complaintResponse.trim()) return;
    const { error } = await supabase.from("complaints").update({
      status: "resolved",
      response: complaintResponse,
      responded_by: user?.id,
    }).eq("id", complaintId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Response Sent", description: "Complaint has been resolved." });
      setComplaintResponse(""); setRespondingTo(null);
      fetchData();
    }
  };

  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [announceTarget, setAnnounceTarget] = useState("all");

  const handleSendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceContent.trim() || !user) return;
    try {
      const { error } = await supabase.from("announcements").insert({
        title: announceTitle,
        content: announceContent,
        type: "announcement",
        created_by: user.id,
        target_audience: announceTarget === "all" ? ["all"] : [announceTarget],
      });
      if (error) throw error;
      toast({ title: "Announcement Sent", description: "Broadcast complete." });
      setAnnounceTitle(""); setAnnounceContent(""); setAnnounceTarget("all");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "Deputy Principal"}
                </h1>
                <p className="text-primary-foreground/80">Deputy Principal • Ogwini Comprehensive Technical High School</p>
              </div>
              {pendingComplaints > 0 && (
                <Badge variant="destructive" className="ml-auto text-sm px-3 py-1">
                  {pendingComplaints} Pending Complaints
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="sticky top-0 bg-background border-b z-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "complaints" && pendingComplaints > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs ml-1">{pendingComplaints}</span>
                  )}
                  {tab.id === "at-risk" && atRiskStudents.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs ml-1">{atRiskStudents.length}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* ─── OVERVIEW ─────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{learners.length}</p>
                    <p className="text-sm text-muted-foreground">Total Learners</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{schoolAvg}%</p>
                    <p className="text-sm text-muted-foreground">School Average</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{schoolPassRate}%</p>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-destructive">{atRiskStudents.length}</p>
                    <p className="text-sm text-muted-foreground">At-Risk Students</p>
                  </CardContent>
                </Card>
              </div>

              {/* Grade Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gradeStats.map(g => (
                      <div key={g.grade} className="flex items-center gap-4">
                        <span className="w-20 font-medium text-sm">Grade {g.grade}</span>
                        <div className="flex-1">
                          <Progress value={g.average} className="h-3" />
                        </div>
                        <span className="w-14 text-right text-sm font-medium">{g.average}%</span>
                        <Badge variant={g.passRate >= 80 ? "default" : g.passRate >= 60 ? "secondary" : "destructive"} className="w-20 justify-center">
                          {g.passRate}% pass
                        </Badge>
                        <span className="text-xs text-muted-foreground w-16 text-right">{g.students} students</span>
                        {g.atRisk > 0 && (
                          <Badge variant="destructive" className="text-xs">{g.atRisk} at risk</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── STREAM COMPARISON ────────────────────────── */}
          {activeTab === "streams" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Stream & Class Comparison</h2>
                  <p className="text-sm text-muted-foreground">Compare parallel classes within a grade</p>
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {gradeFilter === "all" ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gradeStats.map(g => (
                    <Card key={g.grade} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setGradeFilter(g.grade)}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold">Grade {g.grade}</h3>
                          {g.average >= 60 ? <TrendingUp className="w-5 h-5 text-primary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-xl font-bold">{g.students}</p><p className="text-xs text-muted-foreground">Students</p></div>
                          <div><p className="text-xl font-bold">{g.average}%</p><p className="text-xs text-muted-foreground">Average</p></div>
                          <div><p className="text-xl font-bold">{g.passRate}%</p><p className="text-xs text-muted-foreground">Pass Rate</p></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{g.classes.length} classes: {g.classes.join(", ") || "—"}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {streamComparison.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Grade {gradeFilter} — Class Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead className="text-center">Students</TableHead>
                              <TableHead>Average</TableHead>
                              <TableHead className="text-center">Pass Rate</TableHead>
                              <TableHead className="text-center">Assessments</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {streamComparison.map(cls => (
                              <TableRow key={cls.class}>
                                <TableCell className="font-medium">{cls.class}</TableCell>
                                <TableCell className="text-center">{cls.students}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={cls.average} className="w-20 h-2" />
                                    <span className="text-sm font-medium">{cls.average}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{cls.passRate}%</TableCell>
                                <TableCell className="text-center">{cls.assessments}</TableCell>
                                <TableCell>
                                  <Badge variant={cls.average >= 60 ? "default" : cls.average >= 50 ? "secondary" : "destructive"}>
                                    {cls.average >= 60 ? "Good" : cls.average >= 50 ? "Fair" : "At Risk"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent className="py-12 text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No class data available for Grade {gradeFilter}.</p>
                    </CardContent></Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── SUBJECT ANALYTICS ────────────────────────── */}
          {activeTab === "subjects" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Subject Performance Analytics</h2>
                <p className="text-sm text-muted-foreground">Performance trends across all subjects</p>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead className="text-center">Pass Rate</TableHead>
                        <TableHead className="text-center">Assessments</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectPerformance.map((s, i) => (
                        <TableRow key={s.subject}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{s.subject}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={s.average} className="w-20 h-2" />
                              <span className="text-sm font-medium">{s.average}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{s.passRate}%</TableCell>
                          <TableCell className="text-center">{s.count}</TableCell>
                          <TableCell>
                            <Badge variant={s.average >= 60 ? "default" : s.average >= 50 ? "secondary" : "destructive"}>
                              {s.average >= 60 ? "Good" : s.average >= 50 ? "Fair" : "At Risk"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {subjectPerformance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No assessment data available.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── AT-RISK STUDENTS ─────────────────────────── */}
          {activeTab === "at-risk" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  At-Risk Students ({atRiskStudents.length})
                </h2>
                <p className="text-sm text-muted-foreground">Students with an overall average below 50%</p>
              </div>

              {atRiskStudents.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Average</TableHead>
                          <TableHead>Assessments</TableHead>
                          <TableHead>Severity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {atRiskStudents.map((s, i) => (
                          <TableRow key={s.user_id} className="bg-destructive/5">
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                            <TableCell>{s.grade || "—"}</TableCell>
                            <TableCell>{s.class || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={s.average} className="w-16 h-2" />
                                <span className="text-sm font-bold text-destructive">{s.average}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{s.assessments}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {s.average < 30 ? "Critical" : s.average < 40 ? "High" : "Moderate"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card><CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">No at-risk students identified. All students are performing above 50%.</p>
                </CardContent></Card>
              )}
            </div>
          )}

          {/* ─── TIMETABLES ──────────────────────────────── */}
          {activeTab === "timetables" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Consolidated Timetables</h2>
                <p className="text-sm text-muted-foreground">View all published timetables across grades to detect scheduling conflicts</p>
              </div>

              {timetables.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timetables.map(tt => (
                          <TableRow key={tt.id}>
                            <TableCell className="font-medium">{tt.title}</TableCell>
                            <TableCell>Grade {tt.grade}</TableCell>
                            <TableCell>{tt.class || "All"}</TableCell>
                            <TableCell><Badge variant="secondary">{tt.timetable_type}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(tt.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => window.open(tt.file_url, "_blank")}>
                                  <Eye className="w-3 h-3 mr-1" />View
                                </Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={tt.file_url} download><Download className="w-3 h-3" /></a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card><CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No timetables published yet.</p>
                </CardContent></Card>
              )}
            </div>
          )}

          {/* ─── COMPLAINTS ──────────────────────────────── */}
          {activeTab === "complaints" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Student Complaints</h2>
              {complaints.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No complaints received yet.</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {complaints.map(c => {
                    const learner = students.find(s => s.user_id === c.learner_id);
                    return (
                      <Card key={c.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium">
                                {c.is_anonymous ? `Anonymous (${c.grade})` : learner ? `${learner.first_name} ${learner.last_name} (${c.grade})` : c.grade}
                              </p>
                              {c.subject && <p className="text-sm text-muted-foreground">Subject: {c.subject}</p>}
                              <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={c.status === "pending" ? "secondary" : "default"}>
                              {c.status === "pending" ? <Clock className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                              {c.status}
                            </Badge>
                          </div>
                          <p className="text-sm mb-3">{c.complaint_text}</p>
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
                                  <Textarea value={complaintResponse} onChange={e => setComplaintResponse(e.target.value)} placeholder="Type your response..." rows={3} />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleRespondComplaint(c.id)}><Send className="w-4 h-4 mr-1" />Send</Button>
                                    <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setComplaintResponse(""); }}>Cancel</Button>
                                  </div>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setRespondingTo(c.id)}>
                                  <MessageSquare className="w-4 h-4 mr-1" />Respond
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TEACHER RATINGS ──────────────────────────── */}
          {activeTab === "ratings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Teacher Ratings</h2>
                <p className="text-sm text-muted-foreground">Anonymous learner feedback for all teachers</p>
              </div>
              <TeacherRatingsView />
            </div>
          )}

          {/* ─── COMMUNICATION ────────────────────────────── */}
          {activeTab === "communicate" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Staff Communication</h2>
                <p className="text-sm text-muted-foreground">Broadcast announcements to staff or specific groups</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} placeholder="Announcement title" />
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Select value={announceTarget} onValueChange={setAnnounceTarget}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="grade_heads">Grade Heads</SelectItem>
                        <SelectItem value="hod">HODs</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content *</Label>
                    <Textarea value={announceContent} onChange={e => setAnnounceContent(e.target.value)} placeholder="Write your message..." rows={5} />
                  </div>
                  <Button onClick={handleSendAnnouncement} className="w-full" disabled={!announceTitle.trim() || !announceContent.trim()}>
                    <Send className="w-4 h-4 mr-2" />Send Announcement
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
