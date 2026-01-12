import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Download, Upload, Search, Calendar, 
  BookOpen, Loader2, Filter 
} from "lucide-react";

interface PastPaper {
  id: string;
  title: string;
  subject: string;
  grade: string;
  year: number;
  term: string | null;
  file_url: string;
  description: string | null;
  created_at: string;
}

interface PastPapersProps {
  showUpload?: boolean;
  filterGrade?: string;
}

export function PastPapers({ showUpload = false, filterGrade }: PastPapersProps) {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(filterGrade || "");
  const [selectedYear, setSelectedYear] = useState("");

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadGrade, setUploadGrade] = useState("");
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear().toString());
  const [uploadTerm, setUploadTerm] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  const subjects = [
    "IsiZulu", "English (FAL)", "Afrikaans (SAL)", "Mathematics", "Technical Mathematics",
    "Physical Sciences", "Technical Physical Sciences", "Life Sciences", "Natural Sciences",
    "Life Orientation", "Dramatic Arts", "Music", "Visual Arts", "History", "Geography",
    "Technology", "Economics", "Accounting", "E.G.D", "Mechanics", "Agricultural Sciences",
    "Information Technology", "Computer Applications Technology"
  ];

  const grades = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const terms = ["Term 1", "Term 2", "Term 3", "Term 4", "June Exam", "November Exam", "Supplementary"];

  const canUpload = role && ["teacher", "grade_head", "admin", "principal"].includes(role);

  const fetchPapers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("past_papers")
      .select("*")
      .order("year", { ascending: false });

    if (!error && data) {
      setPapers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || paper.subject === selectedSubject;
    const matchesGrade = !selectedGrade || paper.grade === selectedGrade;
    const matchesYear = !selectedYear || paper.year.toString() === selectedYear;
    return matchesSearch && matchesSubject && matchesGrade && matchesYear;
  });

  const handleUpload = async () => {
    if (!uploadTitle || !uploadSubject || !uploadGrade || !uploadYear || !uploadFile) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(`past-papers/${fileName}`, uploadFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(`past-papers/${fileName}`);

      const { error: insertError } = await supabase
        .from("past_papers")
        .insert({
          title: uploadTitle,
          subject: uploadSubject,
          grade: uploadGrade,
          year: parseInt(uploadYear),
          term: uploadTerm || null,
          file_url: urlData.publicUrl,
          description: uploadDescription || null,
          uploaded_by: user?.id,
        });

      if (insertError) throw insertError;

      toast({ title: "Past Paper Uploaded", description: "The past paper is now available for students." });

      // Reset form
      setUploadTitle("");
      setUploadSubject("");
      setUploadGrade("");
      setUploadYear(new Date().getFullYear().toString());
      setUploadTerm("");
      setUploadFile(null);
      setUploadDescription("");

      fetchPapers();
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: "Failed to upload past paper", variant: "destructive" });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section (for staff only) */}
      {showUpload && canUpload && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Past Paper
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Mathematics Paper 1"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Subject *</Label>
              <select
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                value={uploadSubject}
                onChange={(e) => setUploadSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Grade *</Label>
              <select
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                value={uploadGrade}
                onChange={(e) => setUploadGrade(e.target.value)}
              >
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label>Year *</Label>
              <select
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                value={uploadYear}
                onChange={(e) => setUploadYear(e.target.value)}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <Label>Term/Exam</Label>
              <select
                className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground mt-1"
                value={uploadTerm}
                onChange={(e) => setUploadTerm(e.target.value)}
              >
                <option value="">Select Term</option>
                {terms.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>PDF File *</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input
              placeholder="Brief description of the paper..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Past Paper
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search past papers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <select
            className="h-11 px-4 rounded-lg bg-secondary border border-input text-foreground"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="h-11 px-4 rounded-lg bg-secondary border border-input text-foreground"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            className="h-11 px-4 rounded-lg bg-secondary border border-input text-foreground"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No past papers found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPapers.map((paper) => (
            <div key={paper.id} className="glass-card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  {paper.year}
                </span>
              </div>
              <h4 className="font-heading font-semibold text-foreground mb-1">{paper.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{paper.subject}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <span className="px-2 py-0.5 rounded bg-secondary text-xs">{paper.grade}</span>
                {paper.term && <span className="px-2 py-0.5 rounded bg-secondary text-xs">{paper.term}</span>}
              </div>
              {paper.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{paper.description}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(paper.file_url, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
