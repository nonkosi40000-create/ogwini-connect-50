import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Languages, Upload, FileText, Users, Star, TrendingUp, TrendingDown,
  Send, BookOpen, Loader2, BarChart3, AlertTriangle,
  CheckCircle, Clock, Eye, Download, Search, Minus
} from "lucide-react";
import { TeacherRatingsView } from "@/components/dashboard/TeacherRatingsView";

// ─── Types ────────────────────────────────────────────────────
interface Subject {
  id: string;
  name: string;
  code: string;
  department_id: string | null;
}

interface Syllabus {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  grade: string | null;
  year: number | null;
  created_at: string;
  subject_id: string;
}

interface MarkRecord {
  learner_id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  term: string | null;
}

interface MaterialItem {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  type: string;
  file_url: string;
  created_at: string;
  description: string | null;
}

interface QuizItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  total_marks: number | null;
  created_at: string;
}

const GRADES = ["8", "9", "10", "11", "12"];

export default function LLCDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [langDeptId, setLangDeptId] = useState<string | null>(null);

  // Filters
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [materialSearch, setMaterialSearch] = useState("");

  // Upload form
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syllabusTitle, setSyllabusTitle] = useState("");
  const [syllabusDesc, setSyllabusDesc] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "syllabus", label: "Syllabus Management", icon: BookOpen },
    { id: "materials", label: "Content Review", icon: FileText },
    { id: "performance", label: "Performance Analytics", icon: TrendingUp },
    { id: "curriculum", label: "Curriculum Gaps", icon: AlertTriangle },
    { id: "ratings", label: "Teacher Ratings", icon: Star },
    { id: "announce", label: "Announcements", icon: Send },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all subjects and the Languages department
      const [allSubjectsRes, langDeptRes] = await Promise.all([
        supabase.from("subjects").select("*").order("name"),
        supabase.from("departments").select("id").eq("code", "LANG").single(),
      ]);

      const allSubs = (allSubjectsRes.data || []) as Subject[];
      setAllSubjects(allSubs);

      const deptId = langDeptRes.data?.id || null;
      setLangDeptId(deptId);

      const langSubjects = deptId ? allSubs.filter(s => s.department_id === deptId) : [];
      setSubjects(langSubjects);

      const allSubjectNames = allSubs.map(s => s.name);

      // Fetch all data in parallel
      const [syllabiRes, marksRes, materialsRes, quizzesRes] = await Promise.all([
        deptId
          ? supabase.from("syllabi").select("*").eq("department_id", deptId).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase.from("marks").select("learner_id, subject, marks_obtained, total_marks, term"),
        supabase.from("learning_materials").select("*").order("created_at", { ascending: false }),
        supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
      ]);

      if (syllabiRes.data) setSyllabi(syllabiRes.data as Syllabus[]);
      if (marksRes.data) setMarks(marksRes.data as MarkRecord[]);
      if (materialsRes.data) setMaterials(materialsRes.data as MaterialItem[]);
      if (quizzesRes.data) setQuizzes(quizzesRes.data as QuizItem[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived Analytics ──────────────────────────────────────
  const allSubjectNames = allSubjects.map(s => s.name);

  // Subject performance across all grades
  const subjectPerformance = allSubjectNames.map(subj => {
    const subjectMarks = marks.filter(m => m.subject === subj);
    if (subjectMarks.length === 0) return { subject: subj, average: 0, count: 0, passRate: 0 };
    const pcts = subjectMarks.map(m => (m.marks_obtained / m.total_marks) * 100);
    const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const passRate = (pcts.filter(p => p >= 50).length / pcts.length) * 100;
    return { subject: subj, average: Math.round(avg * 10) / 10, count: subjectMarks.length, passRate: Math.round(passRate) };
  }).filter(s => s.count > 0).sort((a, b) => b.average - a.average);

  // Grade performance
  const gradePerformance = GRADES.map(g => {
    const gradeMarks = marks.filter(m => {
      // We don't have grade on marks, but we can use materials or approximate
      return true; // All marks for now
    });
    const pcts = gradeMarks.length > 0
      ? gradeMarks.map(m => (m.marks_obtained / m.total_marks) * 100)
      : [];
    const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
    return { grade: g, average: Math.round(avg * 10) / 10, assessments: pcts.length };
  });

  // School-wide stats
  const schoolAvg = marks.length > 0
    ? Math.round((marks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / marks.length) * 10) / 10
    : 0;
  const schoolPassRate = marks.length > 0
    ? Math.round((marks.filter(m => (m.marks_obtained / m.total_marks) * 100 >= 50).length / marks.length) * 100)
    : 0;

  // Curriculum gap detection: subjects with < 3 materials or no quizzes
  const curriculumGaps = allSubjectNames.map(subj => {
    const matCount = materials.filter(m => m.subject === subj).length;
    const quizCount = quizzes.filter(q => q.subject === subj).length;
    const syllabusCount = syllabi.filter(s => {
      const sub = allSubjects.find(x => x.id === s.subject_id);
      return sub?.name === subj;
    }).length;
    const subPerf = subjectPerformance.find(s => s.subject === subj);
    return {
      subject: subj,
      materials: matCount,
      quizzes: quizCount,
      syllabi: syllabusCount,
      avgPerformance: subPerf?.average || 0,
      hasGap: matCount < 3 || quizCount === 0 || syllabusCount === 0,
    };
  }).sort((a, b) => (b.hasGap ? 1 : 0) - (a.hasGap ? 1 : 0));

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    if (gradeFilter !== "all" && m.grade !== gradeFilter) return false;
    if (subjectFilter !== "all" && m.subject !== subjectFilter) return false;
    if (materialSearch && !m.title.toLowerCase().includes(materialSearch.toLowerCase())) return false;
    return true;
  });

  // ─── Handlers ───────────────────────────────────────────────
  const handleUploadSyllabus = async () => {
    if (!syllabusFile || !syllabusTitle || !selectedSubject || !user || !langDeptId) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileExt = syllabusFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(`syllabi/${fileName}`, syllabusFile);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(`syllabi/${fileName}`);
      const { error: insErr } = await supabase.from("syllabi").insert({
        title: syllabusTitle,
        description: syllabusDesc || null,
        file_url: publicUrl,
        subject_id: selectedSubject,
        department_id: langDeptId,
        grade: selectedGrade || null,
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;

      toast({ title: "Syllabus Uploaded", description: "Successfully uploaded." });
      setSyllabusTitle(""); setSyllabusDesc(""); setSelectedSubject(""); setSelectedGrade(""); setSyllabusFile(null);
      setUploadOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [announceGrade, setAnnounceGrade] = useState("all");

  const handleSendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceContent.trim() || !user) return;
    try {
      const { error } = await supabase.from("announcements").insert({
        title: announceTitle,
        content: announceContent,
        type: "announcement",
        created_by: user.id,
        target_audience: ["all"],
        target_grades: announceGrade !== "all" ? [announceGrade] : null,
      });
      if (error) throw error;
      toast({ title: "Announcement Sent", description: "Your announcement has been broadcast." });
      setAnnounceTitle(""); setAnnounceContent(""); setAnnounceGrade("all");
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
        <div className="bg-primary text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">L.L.C Dashboard</h1>
            <p className="text-primary-foreground/80 mt-1">
              Welcome, {profile?.first_name || "Coordinator"}
            </p>
            <Badge variant="secondary" className="mt-2">
              <Languages className="w-3 h-3 mr-1" />
              Learning & Leadership Committee
            </Badge>
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
                    <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{syllabi.length}</p>
                    <p className="text-sm text-muted-foreground">Syllabi Uploaded</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold">{curriculumGaps.filter(g => g.hasGap).length}</p>
                    <p className="text-sm text-muted-foreground">Curriculum Gaps</p>
                  </CardContent>
                </Card>
              </div>

              {/* Top & Bottom Subjects */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Top Performing Subjects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subjectPerformance.slice(0, 5).map((s, i) => (
                      <div key={s.subject} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                          <span className="font-medium">{s.subject}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={s.average >= 60 ? "default" : "secondary"}>{s.average}%</Badge>
                          <span className="text-xs text-muted-foreground">{s.count} assessments</span>
                        </div>
                      </div>
                    ))}
                    {subjectPerformance.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No assessment data available.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                      Subjects Needing Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subjectPerformance.slice(-5).reverse().map((s, i) => (
                      <div key={s.subject} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{s.subject}</span>
                        <div className="flex items-center gap-3">
                          <Badge variant={s.average < 50 ? "destructive" : "secondary"}>{s.average}%</Badge>
                          <span className="text-xs text-muted-foreground">{s.passRate}% pass</span>
                        </div>
                      </div>
                    ))}
                    {subjectPerformance.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No data yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ─── SYLLABUS MANAGEMENT ──────────────────────── */}
          {activeTab === "syllabus" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Syllabus Management</h2>
                  <p className="text-sm text-muted-foreground">Upload, review and track syllabus coverage</p>
                </div>
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button><Upload className="w-4 h-4 mr-2" />Upload Syllabus</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Syllabus</DialogTitle>
                      <DialogDescription>Upload a syllabus for language subjects</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div><Label>Title *</Label><Input value={syllabusTitle} onChange={e => setSyllabusTitle(e.target.value)} placeholder="e.g. IsiZulu Grade 10 Syllabus 2026" /></div>
                      <div>
                        <Label>Subject *</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Grade</Label>
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                          <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
                          <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Description</Label><Textarea value={syllabusDesc} onChange={e => setSyllabusDesc(e.target.value)} placeholder="Brief description" /></div>
                      <div><Label>File *</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={e => setSyllabusFile(e.target.files?.[0] || null)} /></div>
                      <Button onClick={handleUploadSyllabus} disabled={uploading} className="w-full">
                        {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload</>}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {syllabi.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syllabi.map(s => {
                        const subj = subjects.find(x => x.id === s.subject_id);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.title}</TableCell>
                            <TableCell>{subj?.name || "—"}</TableCell>
                            <TableCell>{s.grade ? `Grade ${s.grade}` : "All"}</TableCell>
                            <TableCell>{s.year}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => window.open(s.file_url, "_blank")}>
                                  <Eye className="w-3 h-3 mr-1" />View
                                </Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={s.file_url} download><Download className="w-3 h-3" /></a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Card><CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No syllabi uploaded yet.</p>
                </CardContent></Card>
              )}
            </div>
          )}

          {/* ─── CONTENT REVIEW ───────────────────────────── */}
          {activeTab === "materials" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Content Review</h2>
                <p className="text-sm text-muted-foreground">Review and track learning materials across all grades and subjects</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search materials..." value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} />
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {allSubjectNames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                {filteredMaterials.length > 0 ? filteredMaterials.slice(0, 50).map(m => (
                  <Card key={m.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.subject || "General"} • {m.grade ? `Grade ${m.grade}` : "All Grades"} • {m.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(m.file_url, "_blank")}>
                          <Eye className="w-3 h-3 mr-1" />View
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={m.file_url} download><Download className="w-3 h-3" /></a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card><CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No materials match your filters.</p>
                  </CardContent></Card>
                )}
              </div>
            </div>
          )}

          {/* ─── PERFORMANCE ANALYTICS ────────────────────── */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Performance Analytics</h2>
                <p className="text-sm text-muted-foreground">Aggregated performance data across grades and subjects</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-bold text-primary">{schoolAvg}%</p>
                    <p className="text-sm text-muted-foreground">School Average</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-bold text-primary">{schoolPassRate}%</p>
                    <p className="text-sm text-muted-foreground">Overall Pass Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-bold">{marks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectPerformance.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Average</TableHead>
                          <TableHead>Pass Rate</TableHead>
                          <TableHead>Assessments</TableHead>
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
                            <TableCell>{s.passRate}%</TableCell>
                            <TableCell>{s.count}</TableCell>
                            <TableCell>
                              <Badge variant={s.average >= 60 ? "default" : s.average >= 50 ? "secondary" : "destructive"}>
                                {s.average >= 60 ? "Good" : s.average >= 50 ? "Fair" : "At Risk"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No assessment data available yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── CURRICULUM GAPS ──────────────────────────── */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Curriculum Gap Analysis</h2>
                <p className="text-sm text-muted-foreground">Identify subjects with insufficient materials, missing quizzes, or no syllabi</p>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Materials</TableHead>
                        <TableHead className="text-center">Quizzes</TableHead>
                        <TableHead className="text-center">Syllabi</TableHead>
                        <TableHead className="text-center">Avg Performance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curriculumGaps.map(g => (
                        <TableRow key={g.subject} className={g.hasGap ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium">{g.subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={g.materials >= 3 ? "default" : "destructive"}>{g.materials}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={g.quizzes > 0 ? "default" : "destructive"}>{g.quizzes}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={g.syllabi > 0 ? "default" : "destructive"}>{g.syllabi}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {g.avgPerformance > 0 ? `${g.avgPerformance}%` : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {g.hasGap ? (
                              <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Gap Detected</Badge>
                            ) : (
                              <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── TEACHER RATINGS ──────────────────────────── */}
          {activeTab === "ratings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Teacher Ratings</h2>
                <p className="text-sm text-muted-foreground">Anonymous learner feedback aggregated across all teachers</p>
              </div>
              <TeacherRatingsView />
            </div>
          )}

          {/* ─── ANNOUNCEMENTS ────────────────────────────── */}
          {activeTab === "announce" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Broadcast Announcement</h2>
                <p className="text-sm text-muted-foreground">Send announcements to specific grades or the entire school</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} placeholder="Announcement title" />
                  </div>
                  <div>
                    <Label>Target Grade</Label>
                    <Select value={announceGrade} onValueChange={setAnnounceGrade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {GRADES.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content *</Label>
                    <Textarea value={announceContent} onChange={e => setAnnounceContent(e.target.value)} placeholder="Write your announcement..." rows={5} />
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
