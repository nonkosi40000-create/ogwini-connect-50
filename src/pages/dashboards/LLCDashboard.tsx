import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Languages, 
  Upload, 
  FileText, 
  Users, 
  Star, 
  TrendingUp,
  Send,
  BookOpen,
  GraduationCap,
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";

interface TeacherRating {
  teacher_id: string;
  subject: string;
  avg_rating: number;
  rating_count: number;
}

interface Syllabus {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  grade: string | null;
  year: number;
  created_at: string;
  subject_id: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function LLCDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<TeacherRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [syllabusTitle, setSyllabusTitle] = useState("");
  const [syllabusDescription, setSyllabusDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get Languages department subjects
      const { data: langDept } = await supabase
        .from("departments")
        .select("id")
        .eq("code", "LANG")
        .single();

      if (langDept) {
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("*")
          .eq("department_id", langDept.id);

        if (subjectsData) {
          setSubjects(subjectsData);
        }

        // Get syllabi for language subjects
        const { data: syllabiData } = await supabase
          .from("syllabi")
          .select("*")
          .eq("department_id", langDept.id)
          .order("created_at", { ascending: false });

        if (syllabiData) {
          setSyllabi(syllabiData);
        }
      }

      // Get teacher ratings for language subjects
      const { data: ratingsData } = await supabase
        .from("teacher_ratings")
        .select("teacher_id, subject, rating")
        .in("subject", ["Afrikaans", "IsiZulu (HL)", "English(FAL)"]);

      if (ratingsData) {
        // Aggregate ratings by teacher and subject
        const aggregated = ratingsData.reduce((acc: Record<string, TeacherRating>, curr) => {
          const key = `${curr.teacher_id}-${curr.subject}`;
          if (!acc[key]) {
            acc[key] = {
              teacher_id: curr.teacher_id,
              subject: curr.subject,
              avg_rating: 0,
              rating_count: 0,
            };
          }
          acc[key].avg_rating += curr.rating;
          acc[key].rating_count += 1;
          return acc;
        }, {});

        const ratings = Object.values(aggregated).map((r) => ({
          ...r,
          avg_rating: r.avg_rating / r.rating_count,
        }));

        setTeacherRatings(ratings);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSyllabus = async () => {
    if (!syllabusFile || !syllabusTitle || !selectedSubject || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = syllabusFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(`syllabi/${fileName}`, syllabusFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(`syllabi/${fileName}`);

      // Get department ID
      const { data: langDept } = await supabase
        .from("departments")
        .select("id")
        .eq("code", "LANG")
        .single();

      if (!langDept) throw new Error("Languages department not found");

      // Insert syllabus record
      const { error: insertError } = await supabase.from("syllabi").insert({
        title: syllabusTitle,
        description: syllabusDescription,
        file_url: publicUrl,
        subject_id: selectedSubject,
        department_id: langDept.id,
        grade: selectedGrade || null,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      toast({
        title: "Syllabus Uploaded",
        description: "The syllabus has been uploaded successfully",
      });

      // Reset form
      setSyllabusTitle("");
      setSyllabusDescription("");
      setSelectedSubject("");
      setSelectedGrade("");
      setSyllabusFile(null);
      setUploadDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error uploading syllabus:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload syllabus. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email;

  const grades = ["8", "9", "10", "11", "12"];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">LLC Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {displayName}</p>
            <Badge variant="outline" className="mt-2">
              <Languages className="w-3 h-3 mr-1" />
              Language Learning Coordinator
            </Badge>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Languages Managed</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Active subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Syllabi Uploaded</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syllabi.length}</div>
              <p className="text-xs text-muted-foreground">Teaching guides</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Teacher Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teacherRatings.length > 0
                  ? (teacherRatings.reduce((a, b) => a + b.avg_rating, 0) / teacherRatings.length).toFixed(1)
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Out of 5 stars</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teacherRatings.reduce((a, b) => a + b.rating_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Student feedback</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="syllabi" className="space-y-4">
          <TabsList>
            <TabsTrigger value="syllabi">
              <BookOpen className="w-4 h-4 mr-2" />
              Syllabi Management
            </TabsTrigger>
            <TabsTrigger value="ratings">
              <Star className="w-4 h-4 mr-2" />
              Teacher Ratings
            </TabsTrigger>
            <TabsTrigger value="communication">
              <Send className="w-4 h-4 mr-2" />
              Communication
            </TabsTrigger>
          </TabsList>

          <TabsContent value="syllabi">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Syllabi Management</CardTitle>
                  <CardDescription>Upload and manage language syllabi for teachers</CardDescription>
                </div>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Syllabus
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload New Syllabus</DialogTitle>
                      <DialogDescription>
                        Upload a syllabus document for language teachers
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={syllabusTitle}
                          onChange={(e) => setSyllabusTitle(e.target.value)}
                          placeholder="e.g., IsiZulu Grade 10 Syllabus 2026"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="grade">Grade</Label>
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={syllabusDescription}
                          onChange={(e) => setSyllabusDescription(e.target.value)}
                          placeholder="Brief description of the syllabus content"
                        />
                      </div>
                      <div>
                        <Label htmlFor="file">File *</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <Button onClick={handleUploadSyllabus} disabled={uploading} className="w-full">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Syllabus
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : syllabi.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No syllabi uploaded yet</p>
                    <p className="text-sm">Upload your first syllabus to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {syllabi.map((syllabus) => (
                      <div
                        key={syllabus.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="w-8 h-8 text-primary" />
                          <div>
                            <h4 className="font-medium">{syllabus.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {syllabus.grade ? `Grade ${syllabus.grade}` : "All Grades"} • {syllabus.year}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={syllabus.file_url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Ratings</CardTitle>
                <CardDescription>View anonymous student feedback for language teachers</CardDescription>
              </CardHeader>
              <CardContent>
                {teacherRatings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No ratings available yet</p>
                    <p className="text-sm">Student feedback will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teacherRatings.map((rating, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <GraduationCap className="w-8 h-8 text-primary" />
                          <div>
                            <h4 className="font-medium">{rating.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {rating.rating_count} ratings
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(rating.avg_rating)
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{rating.avg_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Communication</CardTitle>
                <CardDescription>Send content and updates to language teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Communication features coming soon</p>
                  <p className="text-sm">Send announcements and resources to language teachers</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
