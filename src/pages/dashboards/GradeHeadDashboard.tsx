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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Users, BarChart3, AlertTriangle, Calendar, Upload,
  QrCode, TrendingUp, TrendingDown, Loader2, BookOpen,
  FileText, Star, Search, Eye, Download, ClipboardList,
  CheckCircle, XCircle, Bell, RefreshCw
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
}

interface TeacherProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | null;
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
      supabase.from("profiles").select("user_id, first_name, last_name, email, department_id").neq("grade", gradeAssigned),
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
  const studentAverages = students.map(s => {
    const sMarks = gradeMarks.filter(m => m.learner_id === s.user_id);
    if (sMarks.length === 0) return { ...s, average: null, totalAssessments: 0 };
    const avg = sMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / sMarks.length;
    return { ...s, average: Math.round(avg), totalAssessments: sMarks.length };
  });

  const atRiskStudents = studentAverages.filter(s => s.average !== null && s.average < 50);
  const gradeAverage = studentAverages.filter(s => s.average !== null).length > 0
    ? Math.round(studentAverages.filter(s => s.average !== null).reduce((sum, s) => sum + (s.average || 0), 0) / studentAverages.filter(s => s.average !== null).length)
    : 0;
  const passRate = studentAverages.filter(s => s.average !== null).length > 0
    ? Math.round((studentAverages.filter(s => s.average !== null && s.average >= 50).length / studentAverages.filter(s => s.average !== null).length) * 100)
    : 0;

  // Subject averages
  const subjectAverages = subjects.map(subject => {
    const sMarks = gradeMarks.filter(m => m.subject === subject);
    const avg = sMarks.length > 0 ? Math.round(sMarks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / sMarks.length) : 0;
    return { subject, average: avg, count: sMarks.length };
  }).sort((a, b) => b.average - a.average);

  // Class performance
  const classPerformance = classes.map(cls => {
    const clsStudents = studentAverages.filter(s => s.class === cls);
    const withMarks = clsStudents.filter(s => s.average !== null);
    const avg = withMarks.length > 0 ? Math.round(withMarks.reduce((s, st) => s + (st.average || 0), 0) / withMarks.length) : 0;
    const pass = withMarks.length > 0 ? Math.round((withMarks.filter(s => (s.average || 0) >= 50).length / withMarks.length) * 100) : 0;
    return { class: cls, students: clsStudents.length, average: avg, passRate: pass };
  });

  // Teacher rating aggregation
  const teacherRatingMap = ratings.reduce((acc, r) => {
    if (!acc[r.teacher_id]) acc[r.teacher_id] = { total: 0, count: 0, subjects: new Set<string>() };
    acc[r.teacher_id].total += r.rating;
    acc[r.teacher_id].count += 1;
    acc[r.teacher_id].subjects.add(r.subject);
    return acc;
  }, {} as Record<string, { total: number; count: number; subjects: Set<string> }>);

  const teacherRatingSummary = Object.entries(teacherRatingMap).map(([tid, data]) => {
    const teacher = teachers.find(t => t.user_id === tid);
    return {
      teacher_id: tid,
      name: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown Teacher",
      average: Math.round((data.total / data.count) * 10) / 10,
      reviews: data.count,
      subjects: [...data.subjects],
    };
  }).sort((a, b) => b.average - a.average);

  // Filtered students
  const filteredStudents = studentAverages
    .filter(s => classFilter === "all" || s.class === classFilter)
    .filter(s => {
      const q = studentSearch.toLowerCase();
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
    });

  // Student marks for detail modal
  const selectedStudentMarks = selectedStudent
    ? gradeMarks.filter(m => m.learner_id === selectedStudent.user_id)
    : [];

  // ── Timetable upload handler ──────────────────────────────

  const handleTimetableUpload = async () => {
    if (!ttFile || !ttTitle) {
      toast({ title: "Missing Info", description: "Please provide a title and file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const filePath = `timetables/${gradeAssigned}/${Date.now()}_${ttFile.name}`;
    const { error: upErr } = await supabase.storage.from("uploads").upload(filePath, ttFile);
    if (upErr) {
      toast({ title: "Upload Failed", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
    const { error: insErr } = await supabase.from("timetables").insert({
      title: ttTitle,
      grade: gradeAssigned,
      class: ttClass === "all" ? null : ttClass,
      timetable_type: ttType,
      file_url: urlData.publicUrl,
      uploaded_by: user?.id,
    });
    if (insErr) {
      toast({ title: "Save Failed", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: "Timetable Published", description: `${ttTitle} is now available for ${gradeAssigned}.` });
      setTtFile(null);
      setTtTitle("");
      fetchData();
    }
    setUploading(false);
  };

  // ── Announcement handler ──────────────────────────────────

  const handleAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      toast({ title: "Missing Info", description: "Please fill in the title and content.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("announcements").insert({
      title: announcementTitle,
      content: announcementContent,
      type: "grade",
      target_grades: [gradeAssigned],
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Announcement Sent", description: `Broadcast to all ${gradeAssigned} students.` });
      setAnnouncementTitle("");
      setAnnouncementContent("");
    }
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
                <Badge variant="default" className="text-sm">{students.length} Students</Badge>
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
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Grade Average</p>
                      <p className="text-3xl font-bold text-foreground">{gradeAverage}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pass Rate</p>
                      <p className="text-3xl font-bold text-foreground">{passRate}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-accent" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">At Risk (&lt;50%)</p>
                      <p className="text-3xl font-bold text-destructive">{atRiskStudents.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </CardContent>
                </Card>
              </div>

              {/* Class Performance + Subject Performance */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Class Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {classPerformance.length > 0 ? classPerformance.map(cls => (
                      <div key={cls.class} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{cls.class}</span>
                          <span className="text-muted-foreground">{cls.average}% avg • {cls.passRate}% pass • {cls.students} students</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${cls.average >= 70 ? "bg-primary" : cls.average >= 50 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${cls.average}%` }} />
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No class data available yet.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Subject Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {subjectAverages.length > 0 ? subjectAverages.slice(0, 8).map(s => (
                      <div key={s.subject} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{s.subject}</span>
                          <span className="text-muted-foreground">{s.average}% ({s.count} assessments)</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.average >= 70 ? "bg-primary" : s.average >= 50 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${s.average}%` }} />
                        </div>
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
                            <TableHead className="text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {atRiskStudents.map(s => (
                            <TableRow key={s.id}>
                              <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                              <TableCell>{s.class || "—"}</TableCell>
                              <TableCell className="text-center text-destructive font-bold">{s.average}%</TableCell>
                              <TableCell className="text-center">{s.totalAssessments}</TableCell>
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
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-center">Average</TableHead>
                          <TableHead className="text-center">Assessments</TableHead>
                          <TableHead className="hidden sm:table-cell">Parent</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length > 0 ? filteredStudents.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                            <TableCell>{s.class || "—"}</TableCell>
                            <TableCell className="text-center">
                              {s.average !== null ? (
                                <Badge variant={s.average >= 50 ? "default" : "destructive"}>{s.average}%</Badge>
                              ) : <span className="text-muted-foreground text-xs">No marks</span>}
                            </TableCell>
                            <TableCell className="text-center">{s.totalAssessments}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{s.parent_name || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(s)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                  <Card key={s.subject}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground text-sm">{s.subject}</h4>
                        <Badge variant={s.average >= 70 ? "default" : s.average >= 50 ? "secondary" : "destructive"}>
                          {s.average}%
                        </Badge>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.average >= 70 ? "bg-primary" : s.average >= 50 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${s.average}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{s.count} assessments recorded</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Students</CardTitle>
                  <CardDescription>Students with highest overall averages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-center">Average</TableHead>
                          <TableHead className="text-center">Assessments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentAverages.filter(s => s.average !== null).sort((a, b) => (b.average || 0) - (a.average || 0)).slice(0, 10).map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                            <TableCell>{s.class || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default">{s.average}%</Badge>
                            </TableCell>
                            <TableCell className="text-center">{s.totalAssessments}</TableCell>
                          </TableRow>
                        ))}
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
                  <CardDescription>Scan student QR codes to mark attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full max-w-xs mx-auto aspect-square bg-secondary rounded-xl flex items-center justify-center mb-4">
                    <QrCode className="w-20 h-20 text-muted-foreground" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    QR scanning requires a device camera. Point the camera at a student's QR code to record attendance.
                  </p>
                </CardContent>
              </Card>

              {/* Class attendance summary */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(cls => {
                  const clsStudents = students.filter(s => s.class === cls).length;
                  return (
                    <Card key={cls}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{cls}</span>
                          <Badge variant="secondary">{clsStudents} students</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Manual register available for fallback attendance tracking.</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* ─── TEACHER RATINGS ─────────────────────────── */}
            <TabsContent value="ratings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Ratings Summary</CardTitle>
                  <CardDescription>Anonymous ratings submitted by learners (identified by grade only)</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherRatingSummary.length > 0 ? (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="text-center">Avg Rating</TableHead>
                            <TableHead className="text-center">Reviews</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teacherRatingSummary.map(t => (
                            <TableRow key={t.teacher_id}>
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{t.subjects.join(", ")}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="w-4 h-4 fill-accent text-accent" />
                                  <span className="font-bold">{t.average}</span>
                                  <span className="text-muted-foreground text-xs">/5</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{t.reviews}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No teacher ratings submitted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── TIMETABLES ─────────────────────────────── */}
            <TabsContent value="timetables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Timetable</CardTitle>
                  <CardDescription>Publish a new timetable for {gradeAssigned}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Timetable Title" value={ttTitle} onChange={e => setTtTitle(e.target.value)} />
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
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg" onChange={e => setTtFile(e.target.files?.[0] || null)} />
                  <Button onClick={handleTimetableUpload} disabled={uploading} className="w-full">
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Publish Timetable
                  </Button>
                </CardContent>
              </Card>

              {/* Existing timetables */}
              {timetables.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Published Timetables</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Download</TableHead>
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
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={tt.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
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
            </TabsContent>

            {/* ─── MATERIALS ──────────────────────────────── */}
            <TabsContent value="materials" className="space-y-4">
              {materials.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map(m => (
                    <Card key={m.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm truncate">{m.title}</h4>
                            <p className="text-xs text-muted-foreground">{m.subject} • {m.type}</p>
                            {m.due_date && <p className="text-xs text-destructive mt-1">Due: {new Date(m.due_date).toLocaleDateString()}</p>}
                          </div>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
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
                    <p className="text-muted-foreground">No materials uploaded for {gradeAssigned} yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── ANNOUNCEMENTS ──────────────────────────── */}
            <TabsContent value="announce" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Grade Announcement</CardTitle>
                  <CardDescription>Broadcast a message to all {gradeAssigned} students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Announcement title" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} />
                  <Textarea placeholder="Announcement content..." rows={4} value={announcementContent} onChange={e => setAnnouncementContent(e.target.value)} />
                  <Button onClick={handleAnnouncement} className="w-full">
                    <Bell className="w-4 h-4 mr-2" /> Send Announcement
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ─── Student Detail Modal ────────────────────────── */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
              <DialogDescription>{selectedStudent?.class || gradeAssigned} • {selectedStudent?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedStudent?.parent_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Parent:</span>{" "}
                  <span className="text-foreground">{selectedStudent.parent_name}</span>
                  {selectedStudent.parent_phone && <span className="text-muted-foreground ml-2">({selectedStudent.parent_phone})</span>}
                </div>
              )}

              <div>
                <h4 className="font-medium text-foreground mb-2">Assessment Results</h4>
                {selectedStudentMarks.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedStudentMarks.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm">
                        <div>
                          <span className="font-medium text-foreground">{m.subject}</span>
                          <span className="text-muted-foreground ml-2">• {m.assessment_name}</span>
                        </div>
                        <Badge variant={((m.marks_obtained / m.total_marks) * 100) >= 50 ? "default" : "destructive"}>
                          {m.marks_obtained}/{m.total_marks}
                        </Badge>
                      </div>
                    ))}
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
