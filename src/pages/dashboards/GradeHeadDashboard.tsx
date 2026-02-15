import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  User, Users, BarChart3, AlertTriangle, Calendar, Upload,
  QrCode, TrendingUp, Loader2, BookOpen,
  FileText, Star, Search, Eye, Download,
  Bell, Trophy, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────

interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  class: string | null;
  email: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
}

interface MarkRecord {
  id: string;
  learner_id: string;
  subject: string;
  assessment_name: string;
  assessment_type: string;
  marks_obtained: number;
  total_marks: number;
  term: string | null;
  year: number | null;
  feedback: string | null;
}

interface TeacherRating {
  id: string;
  teacher_id: string;
  rating: number;
  subject: string;
  feedback: string | null;
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

interface MaterialItem {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  type: string;
  file_url: string;
  created_at: string;
  due_date: string | null;
  description: string | null;
}

interface TeacherProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | null;
}

interface StudentAvg extends StudentProfile {
  average: number | null;
  totalAssessments: number;
}

// ─── Component ────────────────────────────────────────────────

export default function GradeHeadDashboard() {
  const { toast } = useToast();
  const { profile, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [ratings, setRatings] = useState<TeacherRating[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);

  // Filters
  const [classFilter, setClassFilter] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [materialSearch, setMaterialSearch] = useState("");

  // Student detail modal
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // Timetable upload
  const [ttFile, setTtFile] = useState<File | null>(null);
  const [ttTitle, setTtTitle] = useState("");
  const [ttClass, setTtClass] = useState("all");
  const [ttType, setTtType] = useState("class");
  const [uploading, setUploading] = useState(false);

  // Announcement
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const gradeAssigned = profile?.grade || "Grade 10";

  // ── Data fetching ──────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [studentsRes, marksRes, ratingsRes, ttRes, matRes, teachersRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("grade", gradeAssigned).order("last_name"),
      supabase.from("marks").select("*"),
      supabase.from("teacher_ratings").select("*"),
      supabase.from("timetables").select("*").eq("grade", gradeAssigned).order("created_at", { ascending: false }),
      supabase.from("learning_materials").select("*").or(`grade.eq.${gradeAssigned},grade.is.null`).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, email, department_id"),
    ]);

    if (studentsRes.data) setStudents(studentsRes.data as StudentProfile[]);
    if (marksRes.data) setMarks(marksRes.data as MarkRecord[]);
    if (ratingsRes.data) setRatings(ratingsRes.data as TeacherRating[]);
    if (ttRes.data) setTimetables(ttRes.data as Timetable[]);
    if (matRes.data) setMaterials(matRes.data as MaterialItem[]);
    if (teachersRes.data) setTeachers(teachersRes.data as TeacherProfile[]);

    setLoading(false);
  }, [gradeAssigned]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived data ──────────────────────────────────────────

  const studentIds = students.map(s => s.user_id);
  const gradeMarks = marks.filter(m => studentIds.includes(m.learner_id));
  const classes = [...new Set(students.map(s => s.class).filter(Boolean))] as string[];
  const subjects = [...new Set(gradeMarks.map(m => m.subject))];

  // Per-student averages
  const studentAverages: StudentAvg[] = students.map(s => {
    const sMarks = gradeMarks.filter(m => m.learner_id === s.user_id);
    if (sMarks.length === 0) return { ...s, average: null, totalAssessments: 0 };
    const avg = sMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / sMarks.length;
    return { ...s, average: Math.round(avg * 10) / 10, totalAssessments: sMarks.length };
  });

  const studentsWithMarks = studentAverages.filter(s => s.average !== null);
  const atRiskStudents = studentsWithMarks.filter(s => (s.average ?? 0) < 50);
  const gradeAverage = studentsWithMarks.length > 0
    ? Math.round(studentsWithMarks.reduce((sum, s) => sum + (s.average || 0), 0) / studentsWithMarks.length)
    : 0;
  const passRate = studentsWithMarks.length > 0
    ? Math.round((studentsWithMarks.filter(s => (s.average ?? 0) >= 50).length / studentsWithMarks.length) * 100)
    : 0;

  // Subject averages
  const subjectAverages = subjects.map(subject => {
    const sMarks = gradeMarks.filter(m => m.subject === subject);
    const avg = sMarks.length > 0 ? Math.round(sMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / sMarks.length) : 0;
    const uniqueStudents = new Set(sMarks.map(m => m.learner_id)).size;
    const highest = sMarks.length > 0 ? Math.round(Math.max(...sMarks.map(m => (m.marks_obtained / m.total_marks) * 100))) : 0;
    const lowest = sMarks.length > 0 ? Math.round(Math.min(...sMarks.map(m => (m.marks_obtained / m.total_marks) * 100))) : 0;
    return { subject, average: avg, count: sMarks.length, students: uniqueStudents, highest, lowest };
  }).sort((a, b) => b.average - a.average);

  // Class performance
  const classPerformance = classes.map(cls => {
    const clsStudents = studentAverages.filter(s => s.class === cls);
    const withMarks = clsStudents.filter(s => s.average !== null);
    const avg = withMarks.length > 0 ? Math.round(withMarks.reduce((s, st) => s + (st.average || 0), 0) / withMarks.length) : 0;
    const pass = withMarks.length > 0 ? Math.round((withMarks.filter(s => (s.average || 0) >= 50).length / withMarks.length) * 100) : 0;
    const atRisk = withMarks.filter(s => (s.average || 0) < 50).length;
    return { class: cls, students: clsStudents.length, average: avg, passRate: pass, atRisk };
  }).sort((a, b) => b.average - a.average);

  // Teacher rating aggregation
  const teacherRatingMap = ratings.reduce((acc, r) => {
    if (!acc[r.teacher_id]) acc[r.teacher_id] = { total: 0, count: 0, subjects: new Set<string>(), feedbacks: [] as string[] };
    acc[r.teacher_id].total += r.rating;
    acc[r.teacher_id].count += 1;
    acc[r.teacher_id].subjects.add(r.subject);
    if (r.feedback) acc[r.teacher_id].feedbacks.push(r.feedback);
    return acc;
  }, {} as Record<string, { total: number; count: number; subjects: Set<string>; feedbacks: string[] }>);

  const teacherRatingSummary = Object.entries(teacherRatingMap).map(([tid, data]) => {
    const teacher = teachers.find(t => t.user_id === tid);
    return {
      teacher_id: tid,
      name: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown Teacher",
      average: Math.round((data.total / data.count) * 10) / 10,
      reviews: data.count,
      subjects: [...data.subjects],
      feedbackCount: data.feedbacks.length,
    };
  }).sort((a, b) => b.average - a.average);

  // Filtered students
  const filteredStudents = studentAverages
    .filter(s => classFilter === "all" || s.class === classFilter)
    .filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase()));

  // Filtered materials
  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.subject?.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Student marks for detail modal
  const selectedStudentMarks = selectedStudent
    ? gradeMarks.filter(m => m.learner_id === selectedStudent.user_id)
    : [];

  const selectedStudentAvg = selectedStudent
    ? studentAverages.find(s => s.user_id === selectedStudent.user_id)
    : null;

  // ── Timetable upload handler ──────────────────────────────

  const handleTimetableUpload = async () => {
    if (!ttFile || !ttTitle) {
      toast({ title: "Missing Info", description: "Please provide a title and file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const filePath = `timetables/${gradeAssigned}/${Date.now()}_${ttFile.name}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(filePath, ttFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      const { error: insErr } = await supabase.from("timetables").insert({
        title: ttTitle,
        grade: gradeAssigned,
        class: ttClass === "all" ? null : ttClass,
        timetable_type: ttType,
        file_url: urlData.publicUrl,
        uploaded_by: user?.id,
      });
      if (insErr) throw insErr;

      // Notify affected learners
      const targetStudents = ttClass === "all"
        ? students
        : students.filter(s => s.class === ttClass);

      if (targetStudents.length > 0) {
        const notifications = targetStudents.map(s => ({
          user_id: s.user_id,
          title: "New Timetable Published",
          message: `A new ${ttType} timetable "${ttTitle}" has been published for ${gradeAssigned}${ttClass !== "all" ? ` (${ttClass})` : ""}.`,
          type: "timetable",
          link_url: urlData.publicUrl,
          link_label: "Download Timetable",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      toast({ title: "Timetable Published", description: `${ttTitle} is now available. ${targetStudents.length} learners notified.` });
      setTtFile(null);
      setTtTitle("");
      setTtClass("all");
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  // ── Announcement handler ──────────────────────────────────

  const handleAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      toast({ title: "Missing Info", description: "Please fill in the title and content.", variant: "destructive" });
      return;
    }
    setSendingAnnouncement(true);
    try {
      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle,
        content: announcementContent,
        type: "grade",
        target_grades: [gradeAssigned],
        created_by: user?.id,
      });
      if (error) throw error;

      // Also send targeted notifications to each student
      if (students.length > 0) {
        const notifications = students.map(s => ({
          user_id: s.user_id,
          title: announcementTitle,
          message: announcementContent.slice(0, 200),
          type: "announcement",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      toast({ title: "Announcement Sent", description: `Broadcast to ${students.length} ${gradeAssigned} students.` });
      setAnnouncementTitle("");
      setAnnouncementContent("");
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setSendingAnnouncement(false);
  };

  // ── Helpers ────────────────────────────────────────────────

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-primary";
    if (pct >= 50) return "text-accent";
    return "text-destructive";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 80) return "bg-primary";
    if (pct >= 50) return "bg-accent";
    return "bg-destructive";
  };

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/15 to-accent/10 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-2xl font-bold text-foreground truncate">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "Grade Head"}
                </h1>
                <p className="text-muted-foreground text-sm">{gradeAssigned} Head • {students.length} Students • {classes.length} Classes</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default" className="text-sm">{gradeAverage}% Average</Badge>
                <Badge variant="secondary" className="text-sm">{passRate}% Pass Rate</Badge>
                {atRiskStudents.length > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {atRiskStudents.length} At Risk
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto bg-card border border-border p-1">
              <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Overview</TabsTrigger>
              <TabsTrigger value="students" className="gap-1.5"><Users className="w-4 h-4" /> Students</TabsTrigger>
              <TabsTrigger value="performance" className="gap-1.5"><TrendingUp className="w-4 h-4" /> Performance</TabsTrigger>
              <TabsTrigger value="attendance" className="gap-1.5"><QrCode className="w-4 h-4" /> Attendance</TabsTrigger>
              <TabsTrigger value="ratings" className="gap-1.5"><Star className="w-4 h-4" /> Teacher Ratings</TabsTrigger>
              <TabsTrigger value="timetables" className="gap-1.5"><Calendar className="w-4 h-4" /> Timetables</TabsTrigger>
              <TabsTrigger value="materials" className="gap-1.5"><BookOpen className="w-4 h-4" /> Materials</TabsTrigger>
              <TabsTrigger value="announce" className="gap-1.5"><Bell className="w-4 h-4" /> Announce</TabsTrigger>
            </TabsList>

            {/* ─── OVERVIEW ─────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-3xl font-bold text-foreground">{students.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">{classes.length} classes</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Grade Average</p>
                      <p className={`text-3xl font-bold ${getScoreColor(gradeAverage)}`}>{gradeAverage}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{studentsWithMarks.length} assessed</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pass Rate</p>
                      <p className={`text-3xl font-bold ${getScoreColor(passRate)}`}>{passRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{studentsWithMarks.filter(s => (s.average ?? 0) >= 50).length} passing</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-accent" />
                  </CardContent>
                </Card>
                <Card className={atRiskStudents.length > 0 ? "border-destructive/30" : ""}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">At Risk (&lt;50%)</p>
                      <p className="text-3xl font-bold text-destructive">{atRiskStudents.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {studentsWithMarks.length > 0 ? `${Math.round((atRiskStudents.length / studentsWithMarks.length) * 100)}% of assessed` : "—"}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </CardContent>
                </Card>
              </div>

              {/* Class Performance + Subject Performance */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Performance</CardTitle>
                    <CardDescription>Average scores and pass rates per class</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {classPerformance.length > 0 ? classPerformance.map(cls => (
                      <div key={cls.class} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{cls.class}</span>
                          <span className="text-muted-foreground">
                            {cls.average}% avg • {cls.passRate}% pass • {cls.students} students
                            {cls.atRisk > 0 && <span className="text-destructive ml-1">• {cls.atRisk} at risk</span>}
                          </span>
                        </div>
                        <Progress value={cls.average} className={`h-3 [&>div]:${getScoreBg(cls.average)}`} />
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No class data available yet.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subject Performance</CardTitle>
                    <CardDescription>Top subjects by average score</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subjectAverages.length > 0 ? subjectAverages.slice(0, 8).map(s => (
                      <div key={s.subject} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{s.subject}</span>
                          <span className={`font-bold ${getScoreColor(s.average)}`}>{s.average}%</span>
                        </div>
                        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getScoreBg(s.average)}`}
                            style={{ width: `${s.average}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{s.students} students • {s.count} assessments</p>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No marks recorded yet.</p>}
                  </CardContent>
                </Card>
              </div>

              {/* At-Risk Students */}
              {atRiskStudents.length > 0 && (
                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" /> At-Risk Students (Below 50%)
                    </CardTitle>
                    <CardDescription>Students requiring academic intervention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead className="text-center">Average</TableHead>
                            <TableHead className="text-center">Assessments</TableHead>
                            <TableHead className="hidden sm:table-cell">Parent Contact</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {atRiskStudents.sort((a, b) => (a.average ?? 0) - (b.average ?? 0)).map(s => (
                            <TableRow key={s.id}>
                              <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                              <TableCell>{s.class || "—"}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive">{s.average}%</Badge>
                              </TableCell>
                              <TableCell className="text-center">{s.totalAssessments}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {s.parent_phone || s.parent_name || "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button size="sm" variant="outline" onClick={() => setSelectedStudent(s)}>
                                  <Eye className="w-3 h-3 mr-1" /> View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats Row */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5 text-center">
                    <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{materials.length}</p>
                    <p className="text-sm text-muted-foreground">Learning Materials</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <Calendar className="w-8 h-8 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{timetables.length}</p>
                    <p className="text-sm text-muted-foreground">Published Timetables</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <Star className="w-8 h-8 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{teacherRatingSummary.length}</p>
                    <p className="text-sm text-muted-foreground">Teachers Rated</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── STUDENTS ─────────────────────────────────── */}
            <TabsContent value="students" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes ({students.length})</SelectItem>
                    {classes.map(c => {
                      const count = students.filter(s => s.class === c).length;
                      return <SelectItem key={c} value={c}>{c} ({count})</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-center">Average</TableHead>
                          <TableHead className="text-center">Assessments</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead className="hidden lg:table-cell">Parent</TableHead>
                          <TableHead className="text-center">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length > 0 ? filteredStudents.map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                            <TableCell>{s.class || "—"}</TableCell>
                            <TableCell className="text-center">
                              {s.average !== null ? (
                                <Badge variant={(s.average ?? 0) >= 50 ? "default" : "destructive"}>{s.average}%</Badge>
                              ) : <span className="text-muted-foreground text-xs">No marks</span>}
                            </TableCell>
                            <TableCell className="text-center">{s.totalAssessments}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.email}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{s.parent_name || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(s)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No students found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">Showing {filteredStudents.length} of {students.length} students</p>
            </TabsContent>

            {/* ─── PERFORMANCE ──────────────────────────────── */}
            <TabsContent value="performance" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject breakdown */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(subjectFilter === "all" ? subjectAverages : subjectAverages.filter(s => s.subject === subjectFilter)).map(s => (
                  <Card key={s.subject} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground text-sm">{s.subject}</h4>
                        <Badge variant={s.average >= 70 ? "default" : s.average >= 50 ? "secondary" : "destructive"}>
                          {s.average}%
                        </Badge>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full ${getScoreBg(s.average)}`} style={{ width: `${s.average}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="text-sm font-bold text-foreground">{s.students}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Highest</p>
                          <p className="text-sm font-bold text-primary">{s.highest}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Lowest</p>
                          <p className="text-sm font-bold text-destructive">{s.lowest}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" /> Top Performing Students
                  </CardTitle>
                  <CardDescription>
                    {subjectFilter === "all" ? "Overall highest averages" : `Top performers in ${subjectFilter}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-center">Average</TableHead>
                          <TableHead className="text-center">Assessments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let leaderboard = studentsWithMarks;
                          if (subjectFilter !== "all") {
                            leaderboard = students.map(s => {
                              const subjMarks = gradeMarks.filter(m => m.learner_id === s.user_id && m.subject === subjectFilter);
                              if (subjMarks.length === 0) return { ...s, average: null, totalAssessments: 0 };
                              const avg = subjMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / subjMarks.length;
                              return { ...s, average: Math.round(avg * 10) / 10, totalAssessments: subjMarks.length };
                            }).filter(s => s.average !== null);
                          }
                          return leaderboard.sort((a, b) => (b.average || 0) - (a.average || 0)).slice(0, 15).map((s, i) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-bold">
                                {i < 3 ? (
                                  <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                                    i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-secondary text-foreground" : "bg-primary/10 text-primary"
                                  }`}>{i + 1}</span>
                                ) : i + 1}
                              </TableCell>
                              <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                              <TableCell>{s.class || "—"}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="default">{s.average}%</Badge>
                              </TableCell>
                              <TableCell className="text-center">{s.totalAssessments}</TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ATTENDANCE ──────────────────────────────── */}
            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> QR Attendance Scanner</CardTitle>
                  <CardDescription>Scan student QR codes to mark attendance (coming soon)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full max-w-xs mx-auto aspect-square bg-secondary rounded-xl flex flex-col items-center justify-center mb-4 border-2 border-dashed border-border">
                    <QrCode className="w-20 h-20 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Camera scanner placeholder</p>
                    <Badge variant="secondary" className="mt-2"><Clock className="w-3 h-3 mr-1" /> Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Class attendance summary */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(cls => {
                  const clsStudents = students.filter(s => s.class === cls);
                  const clsWithMarks = studentAverages.filter(s => s.class === cls && s.average !== null);
                  const clsAvg = clsWithMarks.length > 0 ? Math.round(clsWithMarks.reduce((a, s) => a + (s.average || 0), 0) / clsWithMarks.length) : 0;
                  return (
                    <Card key={cls}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-foreground text-lg">{cls}</span>
                          <Badge variant="secondary">{clsStudents.length} students</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="p-2 rounded-lg bg-secondary/50">
                            <p className="text-lg font-bold text-foreground">{clsStudents.length}</p>
                            <p className="text-xs text-muted-foreground">Enrolled</p>
                          </div>
                          <div className="p-2 rounded-lg bg-secondary/50">
                            <p className={`text-lg font-bold ${getScoreColor(clsAvg)}`}>{clsAvg}%</p>
                            <p className="text-xs text-muted-foreground">Class Avg</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {classes.length === 0 && (
                  <Card className="sm:col-span-2 lg:col-span-3">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No classes found for {gradeAssigned}.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ─── TEACHER RATINGS ─────────────────────────── */}
            <TabsContent value="ratings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Ratings Summary</CardTitle>
                  <CardDescription>Anonymous ratings submitted by learners (identified by grade only). Individual responses are never exposed.</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherRatingSummary.length > 0 ? (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="text-center">Avg Rating</TableHead>
                            <TableHead className="text-center">Reviews</TableHead>
                            <TableHead className="text-center">Written Feedback</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teacherRatingSummary.map((t, i) => (
                            <TableRow key={t.teacher_id}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.subjects.join(", ")}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(t.average) ? "fill-accent text-accent" : "text-muted"}`} />
                                  ))}
                                  <span className="font-bold ml-1">{t.average}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{t.reviews}</TableCell>
                              <TableCell className="text-center">{t.feedbackCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No teacher ratings submitted yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── TIMETABLES ─────────────────────────────── */}
            <TabsContent value="timetables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Timetable</CardTitle>
                  <CardDescription>Publish a new timetable for {gradeAssigned}. Affected learners will be notified automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Timetable Title *" value={ttTitle} onChange={e => setTtTitle(e.target.value)} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select value={ttType} onValueChange={setTtType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Class Timetable</SelectItem>
                        <SelectItem value="exam">Exam Timetable</SelectItem>
                        <SelectItem value="weekend">Weekend Classes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={ttClass} onValueChange={setTtClass}>
                      <SelectTrigger><SelectValue placeholder="Target Class" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes ({students.length} students)</SelectItem>
                        {classes.map(c => {
                          const count = students.filter(s => s.class === c).length;
                          return <SelectItem key={c} value={c}>{c} ({count} students)</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground mb-1">Upload File *</p>
                    <p className="text-xs text-muted-foreground mb-3">PDF, Excel, Image formats</p>
                    <Input type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg" onChange={e => setTtFile(e.target.files?.[0] || null)} className="max-w-xs mx-auto" />
                    {ttFile && <p className="text-xs text-primary mt-2">{ttFile.name}</p>}
                  </div>
                  <Button onClick={handleTimetableUpload} disabled={uploading} className="w-full">
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Publish & Notify Learners
                  </Button>
                </CardContent>
              </Card>

              {/* Existing timetables */}
              {timetables.length > 0 ? (
                <Card>
                  <CardHeader><CardTitle>Published Timetables ({timetables.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Published</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timetables.map(tt => (
                            <TableRow key={tt.id}>
                              <TableCell className="font-medium">{tt.title}</TableCell>
                              <TableCell><Badge variant="secondary">{tt.timetable_type}</Badge></TableCell>
                              <TableCell>{tt.class || "All"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{new Date(tt.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="ghost" asChild>
                                    <a href={tt.file_url} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
                                  </Button>
                                  <Button size="sm" variant="ghost" asChild>
                                    <a href={tt.file_url} download><Download className="w-4 h-4" /></a>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No timetables published yet for {gradeAssigned}.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── MATERIALS ──────────────────────────────── */}
            <TabsContent value="materials" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search materials..." value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} className="pl-9" />
                </div>
                <Badge variant="secondary" className="self-center">{filteredMaterials.length} materials</Badge>
              </div>
              {filteredMaterials.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map(m => (
                    <Card key={m.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm truncate">{m.title}</h4>
                            <p className="text-xs text-muted-foreground">{m.subject || "General"} • {m.type}</p>
                            {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                            {m.due_date && <p className="text-xs text-destructive mt-1">Due: {new Date(m.due_date).toLocaleDateString()}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer"><Eye className="w-3 h-3 mr-1" /> View</a>
                          </Button>
                          <Button size="sm" variant="default" className="flex-1" asChild>
                            <a href={m.file_url} download><Download className="w-3 h-3 mr-1" /> Download</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {materialSearch ? "No materials match your search." : `No materials uploaded for ${gradeAssigned} yet.`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── ANNOUNCEMENTS ──────────────────────────── */}
            <TabsContent value="announce" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Grade Announcement</CardTitle>
                  <CardDescription>Broadcast a message to all {students.length} {gradeAssigned} students. Each student will receive a personal notification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Announcement title *" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} />
                  <Textarea
                    placeholder="Write your announcement message..."
                    rows={5}
                    value={announcementContent}
                    onChange={e => setAnnouncementContent(e.target.value)}
                  />
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                      <Bell className="w-4 h-4 inline mr-1 text-primary" />
                      This will send a notification to <strong className="text-foreground">{students.length}</strong> students in <strong className="text-foreground">{gradeAssigned}</strong>.
                    </p>
                  </div>
                  <Button onClick={handleAnnouncement} disabled={sendingAnnouncement || !announcementTitle || !announcementContent} className="w-full">
                    {sendingAnnouncement ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
                    Send Announcement
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ─── Student Detail Modal ────────────────────────── */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
              <DialogDescription>{selectedStudent?.class || gradeAssigned} • {selectedStudent?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Summary */}
              {selectedStudentAvg && selectedStudentAvg.average !== null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className={`text-2xl font-bold ${getScoreColor(selectedStudentAvg.average)}`}>{selectedStudentAvg.average}%</p>
                    <p className="text-xs text-muted-foreground">Overall Average</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedStudentAvg.totalAssessments}</p>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </div>
                </div>
              )}

              {/* Parent Info */}
              {(selectedStudent?.parent_name || selectedStudent?.parent_phone || selectedStudent?.parent_email) && (
                <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Parent / Guardian</p>
                  {selectedStudent.parent_name && <p className="text-sm text-foreground">{selectedStudent.parent_name}</p>}
                  {selectedStudent.parent_phone && <p className="text-sm text-muted-foreground">{selectedStudent.parent_phone}</p>}
                  {selectedStudent.parent_email && <p className="text-sm text-muted-foreground">{selectedStudent.parent_email}</p>}
                </div>
              )}

              {/* Assessment Results */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Assessment Results</h4>
                {selectedStudentMarks.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedStudentMarks.map(m => {
                      const pct = Math.round((m.marks_obtained / m.total_marks) * 100);
                      return (
                        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground">{m.subject}</span>
                            <span className="text-muted-foreground ml-2">• {m.assessment_name}</span>
                            {m.feedback && <p className="text-xs text-muted-foreground mt-0.5 truncate">"{m.feedback}"</p>}
                          </div>
                          <div className="text-right ml-3">
                            <Badge variant={pct >= 50 ? "default" : "destructive"}>
                              {m.marks_obtained}/{m.total_marks}
                            </Badge>
                            <p className={`text-xs font-bold mt-0.5 ${getScoreColor(pct)}`}>{pct}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assessments recorded.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
