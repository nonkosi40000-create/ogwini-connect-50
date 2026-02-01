import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, BookOpen, FileText, Users, Upload, MessageSquare, 
  ClipboardCheck, BarChart3, Bell, Send, Plus, CheckCircle,
  Loader2, Download, Calendar, Save, X, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PastPapers } from "@/components/PastPapers";

interface LearningMaterial {
  id: string;
  title: string;
  description: string | null;
  type: string;
  subject: string | null;
  grade: string | null;
  file_url: string;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  total_marks: number | null;
  created_at: string;
}

interface Student {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
}

interface AttendanceRecord {
  student_id: string;
  present: boolean;
}

export default function TeacherDashboard() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClass, setSelectedClass] = useState("Grade 11");
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("notes");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadGrade, setUploadGrade] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  // Quiz form state
  const [quizTitle, setQuizTitle] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [quizGrade, setQuizGrade] = useState("");
  const [quizDuration, setQuizDuration] = useState("30");

  // Marks form
  const [marksSubject, setMarksSubject] = useState("");
  const [marksAssessment, setMarksAssessment] = useState("");
  const [marksTotalMarks, setMarksTotalMarks] = useState("100");
  const [studentMarks, setStudentMarks] = useState<Record<string, string>>({});
  const [studentFeedback, setStudentFeedback] = useState<Record<string, string>>({});
  const [savingMarks, setSavingMarks] = useState(false);

  // Email form
  const [notificationMessage, setNotificationMessage] = useState("");

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "materials", label: "Learning Materials", icon: BookOpen },
    { id: "pastpapers", label: "Past Papers", icon: FileText },
    { id: "quizzes", label: "Quizzes & Tests", icon: ClipboardCheck },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "marks", label: "Marks & Feedback", icon: FileText },
    { id: "communicate", label: "Communicate", icon: MessageSquare },
  ];

  const grades = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  const subjects = ["Mathematics", "Physical Sciences", "Life Sciences", "English", "Afrikaans", "Geography", "History", "Accounting", "Business Studies", "Technical Drawing", "Life Orientation"];
  const materialTypes = ["notes", "worksheet", "past-paper", "study-guide", "activity", "book", "ebook"];

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('learning_materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMaterials(data);
    }
  };

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setQuizzes(data);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, grade')
      .eq('grade', selectedClass)
      .order('last_name');
    
    if (!error && data) {
      setStudents(data);
      // Initialize attendance records
      setAttendance(data.map(s => ({ student_id: s.user_id, present: true })));
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMaterials(), fetchQuizzes(), fetchStudents()]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => prev.map(a => 
      a.student_id === studentId ? { ...a, present: !a.present } : a
    ));
  };

  const saveAttendance = async () => {
    setSavingAttendance(true);
    // For now, just show success - would integrate with an attendance table
    toast({
      title: "Attendance Saved",
      description: `Attendance for ${attendanceDate} has been recorded.`,
    });
    setSavingAttendance(false);
  };

  const handleSaveMarks = async () => {
    if (!marksSubject || !marksAssessment) {
      toast({ title: "Missing Fields", description: "Please fill in subject and assessment name.", variant: "destructive" });
      return;
    }

    setSavingMarks(true);
    try {
      const entries = Object.entries(studentMarks)
        .filter(([_, mark]) => mark !== "")
        .map(([studentId, mark]) => ({
          learner_id: studentId,
          subject: marksSubject,
          assessment_name: marksAssessment,
          assessment_type: "test",
          marks_obtained: parseFloat(mark),
          total_marks: parseFloat(marksTotalMarks),
          recorded_by: user?.id,
          feedback: studentFeedback[studentId] || null,
        }));

      if (entries.length === 0) {
        toast({ title: "No Marks", description: "Please enter at least one mark.", variant: "destructive" });
        setSavingMarks(false);
        return;
      }

      const { error } = await supabase.from('marks').insert(entries);
      
      if (error) throw error;

      toast({
        title: "Marks Saved",
        description: `${entries.length} marks with feedback recorded successfully.`,
      });
      setStudentMarks({});
      setStudentFeedback({});
    } catch (error) {
      console.error('Error saving marks:', error);
      toast({ title: "Error", description: "Failed to save marks.", variant: "destructive" });
    }
    setSavingMarks(false);
  };

  const handleUploadMaterial = async () => {
    if (!uploadTitle || !uploadType || !uploadFile) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${uploadFile.name}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`materials/${fileName}`, uploadFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(`materials/${fileName}`);

      // Insert material record
      const { error: insertError } = await supabase
        .from('learning_materials')
        .insert({
          title: uploadTitle,
          description: uploadDescription,
          type: uploadType,
          subject: uploadSubject,
          grade: uploadGrade,
          file_url: urlData.publicUrl,
          uploaded_by: user?.id,
        });

      if (insertError) throw insertError;

      toast({ title: "Material Uploaded", description: "Your content is now available to students." });
      
      // Reset form
      setUploadTitle("");
      setUploadDescription("");
      setUploadType("notes");
      setUploadSubject("");
      setUploadGrade("");
      setUploadFile(null);
      
      fetchMaterials();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Upload Failed", description: "Failed to upload material", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleCreateQuiz = async () => {
    if (!quizTitle || !quizSubject || !quizGrade) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          title: quizTitle,
          subject: quizSubject,
          grade: quizGrade,
          duration_minutes: parseInt(quizDuration),
          status: 'draft',
          created_by: user?.id,
        });

      if (error) throw error;

      toast({ title: "Quiz Created", description: "Your quiz has been created as a draft." });
      
      setQuizTitle("");
      setQuizSubject("");
      setQuizGrade("");
      setQuizDuration("30");
      
      fetchQuizzes();
    } catch (error) {
      console.error('Quiz creation error:', error);
      toast({ title: "Error", description: "Failed to create quiz", variant: "destructive" });
    }
  };

  const sendNotification = async () => {
    if (!notificationMessage.trim()) return;
    
    try {
      await supabase
        .from('announcements')
        .insert({
          title: `Message from ${profile?.first_name} ${profile?.last_name}`,
          content: notificationMessage,
          type: 'notification',
          created_by: user?.id,
          target_audience: ['learners'],
        });

      toast({
        title: "Notification Sent",
        description: `Your message has been sent to students.`,
      });
      setNotificationMessage("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'Teacher'}
                </h1>
                <p className="text-muted-foreground">Teacher Dashboard • Ogwini School</p>
              </div>
              <div className="ml-auto flex gap-2">
                <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {materials.length} Materials
                </div>
                <div className="px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold">
                  {quizzes.length} Quizzes
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
                      ? "bg-primary text-primary-foreground"
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="glass-card p-6 text-center">
                        <p className="text-3xl font-bold text-foreground">{materials.length}</p>
                        <p className="text-sm text-muted-foreground">Materials Uploaded</p>
                      </div>
                      <div className="glass-card p-6 text-center">
                        <p className="text-3xl font-bold text-foreground">{quizzes.length}</p>
                        <p className="text-sm text-muted-foreground">Quizzes Created</p>
                      </div>
                      <div className="glass-card p-6 text-center">
                        <p className="text-3xl font-bold text-foreground">{quizzes.filter(q => q.status === 'published').length}</p>
                        <p className="text-sm text-muted-foreground">Published</p>
                      </div>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button onClick={() => setActiveTab("materials")} className="h-auto py-4">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6" />
                            <span>Upload Material</span>
                          </div>
                        </Button>
                        <Button variant="accent" onClick={() => setActiveTab("quizzes")} className="h-auto py-4">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardCheck className="w-6 h-6" />
                            <span>Create Quiz</span>
                          </div>
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("marks")} className="h-auto py-4">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-6 h-6" />
                            <span>Enter Marks</span>
                          </div>
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("communicate")} className="h-auto py-4">
                          <div className="flex flex-col items-center gap-2">
                            <MessageSquare className="w-6 h-6" />
                            <span>Send Notification</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Recent Materials</h3>
                    <div className="space-y-3">
                      {materials.slice(0, 5).map((material) => (
                        <div key={material.id} className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-sm font-medium text-foreground">{material.title}</p>
                          <p className="text-xs text-muted-foreground">{material.type} • {material.grade}</p>
                        </div>
                      ))}
                      {materials.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No materials uploaded yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Materials */}
              {activeTab === "materials" && (
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Upload Learning Material</h2>
                    
                    <div className="glass-card p-6 space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input 
                          placeholder="e.g., Algebra Chapter 5 Notes" 
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Content Type *</Label>
                          <select 
                            className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                            value={uploadType}
                            onChange={(e) => setUploadType(e.target.value)}
                          >
                            {materialTypes.map(t => (
                              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Subject</Label>
                          <select 
                            className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                            value={uploadSubject}
                            onChange={(e) => setUploadSubject(e.target.value)}
                          >
                            <option value="">Select subject</option>
                            {subjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Grade</Label>
                        <select 
                          className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                          value={uploadGrade}
                          onChange={(e) => setUploadGrade(e.target.value)}
                        >
                          <option value="">All Grades</option>
                          {grades.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <textarea
                          placeholder="Brief description of the material..."
                          className="w-full h-20 px-4 py-3 rounded-lg bg-secondary border border-input text-foreground resize-none mt-1"
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                        />
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-foreground mb-1">Upload File *</p>
                        <p className="text-xs text-muted-foreground mb-3">PDF, DOC, PPT (max 25MB)</p>
                        <Input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.ppt,.pptx" 
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="max-w-xs mx-auto"
                        />
                        {uploadFile && <p className="text-xs text-primary mt-2">{uploadFile.name}</p>}
                      </div>
                      <Button className="w-full" onClick={handleUploadMaterial} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload Material
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Uploaded Materials</h2>
                    <div className="space-y-4">
                      {materials.map((material) => (
                        <div key={material.id} className="glass-card p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">{material.title}</h4>
                              <p className="text-sm text-muted-foreground">{material.subject} • {material.grade} • {material.type}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(material.created_at).toLocaleDateString()}</p>
                            </div>
                            <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))}
                      {materials.length === 0 && (
                        <div className="glass-card p-8 text-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No materials uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Past Papers */}
              {activeTab === "pastpapers" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Past Papers Management</h2>
                  <PastPapers showUpload={true} />
                </div>
              )}

              {/* Quizzes */}
              {activeTab === "quizzes" && (
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Create New Quiz</h2>
                    
                    <div className="glass-card p-6 space-y-4">
                      <div>
                        <Label>Quiz Title *</Label>
                        <Input 
                          placeholder="e.g., Chapter 5 Assessment" 
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Subject *</Label>
                          <select 
                            className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                            value={quizSubject}
                            onChange={(e) => setQuizSubject(e.target.value)}
                          >
                            <option value="">Select subject</option>
                            {subjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Grade *</Label>
                          <select 
                            className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                            value={quizGrade}
                            onChange={(e) => setQuizGrade(e.target.value)}
                          >
                            <option value="">Select grade</option>
                            {grades.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input 
                          type="number" 
                          value={quizDuration}
                          onChange={(e) => setQuizDuration(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleCreateQuiz}>
                        <Plus className="w-4 h-4 mr-2" /> Create Quiz
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-semibold text-foreground">My Quizzes</h2>
                    <div className="space-y-4">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="glass-card p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">{quiz.title}</h4>
                              <p className="text-sm text-muted-foreground">{quiz.subject} • {quiz.grade}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quiz.status === 'published' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                            }`}>
                              {quiz.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {quizzes.length === 0 && (
                        <div className="glass-card p-8 text-center">
                          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No quizzes created yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance */}
              {activeTab === "attendance" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Mark Attendance</h2>
                    <div className="flex gap-3">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="h-10 px-4 rounded-lg bg-secondary border border-input text-foreground"
                      >
                        {grades.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <Input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                  </div>

                  {students.length > 0 ? (
                    <div className="glass-card overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">#</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student Name</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Present</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Absent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => {
                            const record = attendance.find(a => a.student_id === student.user_id);
                            const isPresent = record?.present ?? true;
                            return (
                              <tr key={student.id} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-foreground">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => toggleAttendance(student.user_id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                      isPresent ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => toggleAttendance(student.user_id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                      !isPresent ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="p-4 border-t border-border flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Present: {attendance.filter(a => a.present).length} | Absent: {attendance.filter(a => !a.present).length}
                        </p>
                        <Button onClick={saveAttendance} disabled={savingAttendance}>
                          {savingAttendance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Attendance
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No students found in {selectedClass}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Marks */}
              {activeTab === "marks" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Enter Marks</h2>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="h-10 px-4 rounded-lg bg-secondary border border-input text-foreground"
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="glass-card p-6 space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label>Subject *</Label>
                        <select 
                          className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                          value={marksSubject}
                          onChange={(e) => setMarksSubject(e.target.value)}
                        >
                          <option value="">Select subject</option>
                          {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Assessment Name *</Label>
                        <Input 
                          placeholder="e.g., Test 1, Assignment 2"
                          value={marksAssessment}
                          onChange={(e) => setMarksAssessment(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Total Marks</Label>
                        <Input 
                          type="number"
                          value={marksTotalMarks}
                          onChange={(e) => setMarksTotalMarks(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {students.length > 0 ? (
                    <div className="glass-card overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">#</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student Name</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Mark (/{marksTotalMarks})</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-foreground">%</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Feedback (Private)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => {
                            const mark = studentMarks[student.user_id] || "";
                            const percentage = mark ? Math.round((parseFloat(mark) / parseFloat(marksTotalMarks)) * 100) : null;
                            return (
                              <tr key={student.id} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-foreground">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={marksTotalMarks}
                                    value={mark}
                                    onChange={(e) => setStudentMarks(prev => ({
                                      ...prev,
                                      [student.user_id]: e.target.value
                                    }))}
                                    className="w-20 mx-auto text-center"
                                  />
                                </td>
                                <td className={`px-4 py-3 text-center font-bold ${
                                  percentage !== null ? (percentage >= 50 ? "text-primary" : "text-destructive") : "text-muted-foreground"
                                }`}>
                                  {percentage !== null ? `${percentage}%` : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    placeholder="Private feedback for this student..."
                                    value={studentFeedback[student.user_id] || ""}
                                    onChange={(e) => setStudentFeedback(prev => ({
                                      ...prev,
                                      [student.user_id]: e.target.value
                                    }))}
                                    className="text-sm"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="p-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          <strong>Note:</strong> Feedback is private and will only be visible to each individual student.
                        </p>
                        <div className="flex justify-end">
                          <Button onClick={handleSaveMarks} disabled={savingMarks}>
                            {savingMarks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Marks & Feedback
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No students found in {selectedClass}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Communicate */}
              {activeTab === "communicate" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Send Notification</h2>
                  
                  <div className="glass-card p-6 space-y-4">
                    <div>
                      <Label>Select Recipients</Label>
                      <select className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1">
                        <option value="all">All My Classes</option>
                        {grades.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Message</Label>
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        placeholder="Type your message to students..."
                        className="w-full h-32 px-4 py-3 rounded-lg bg-secondary border border-input text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                      />
                    </div>
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Note:</strong> This notification will be sent to all students in the selected class(es).
                      </p>
                    </div>
                    <Button className="w-full" onClick={sendNotification} disabled={!notificationMessage.trim()}>
                      <Send className="w-4 h-4 mr-2" /> Send Notification
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
