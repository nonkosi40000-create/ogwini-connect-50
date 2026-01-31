import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Upload, Plus, Download, Loader2, Trash2 } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Syllabus {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  grade: string | null;
  year: number;
  subject_id: string | null;
  subjects?: { name: string } | null;
  created_at: string;
}

interface SyllabusUploadProps {
  departmentId: string;
  departmentName: string;
}

const grades = [
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export function SyllabusUpload({ departmentId, departmentName }: SyllabusUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSyllabus, setNewSyllabus] = useState({
    title: "",
    description: "",
    grade: "",
    subject_id: "",
    year: new Date().getFullYear(),
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [departmentId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch subjects in this department
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name, code")
      .eq("department_id", departmentId);

    if (subjectsData) {
      setSubjects(subjectsData);
    }

    // Fetch syllabi for this department
    const { data: syllabiData } = await supabase
      .from("syllabi")
      .select("*, subjects(name)")
      .eq("department_id", departmentId)
      .order("created_at", { ascending: false });

    if (syllabiData) {
      setSyllabi(syllabiData as Syllabus[]);
    }

    setLoading(false);
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) {
      toast({
        title: "Missing File",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!newSyllabus.title || !newSyllabus.subject_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title and select a subject.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `syllabus-${Date.now()}.${fileExt}`;
      const filePath = `syllabi/${departmentId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      // Insert syllabus record
      const { error: insertError } = await supabase.from("syllabi").insert({
        department_id: departmentId,
        subject_id: newSyllabus.subject_id,
        title: newSyllabus.title,
        description: newSyllabus.description || null,
        file_url: publicUrl,
        grade: newSyllabus.grade || null,
        year: newSyllabus.year,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      toast({
        title: "Syllabus Uploaded",
        description: "The syllabus has been uploaded successfully.",
      });

      setNewSyllabus({
        title: "",
        description: "",
        grade: "",
        subject_id: "",
        year: new Date().getFullYear(),
      });
      setSelectedFile(null);
      setIsAddingOpen(false);
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

  const handleDelete = async (syllabusId: string) => {
    try {
      const { error } = await supabase
        .from("syllabi")
        .delete()
        .eq("id", syllabusId);

      if (error) throw error;

      toast({
        title: "Syllabus Deleted",
        description: "The syllabus has been removed.",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting syllabus:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete syllabus.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Syllabus Management</h2>
          <p className="text-sm text-muted-foreground">
            Upload and manage curriculum documents for {departmentName}
          </p>
        </div>
        <Dialog open={isAddingOpen} onOpenChange={setIsAddingOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Syllabus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Syllabus</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newSyllabus.title}
                  onChange={(e) =>
                    setNewSyllabus({ ...newSyllabus, title: e.target.value })
                  }
                  placeholder="e.g., Mathematics Term 1 Syllabus"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Select
                  value={newSyllabus.subject_id}
                  onValueChange={(value) =>
                    setNewSyllabus({ ...newSyllabus, subject_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
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
                <label className="text-sm font-medium">Grade</label>
                <Select
                  value={newSyllabus.grade}
                  onValueChange={(value) =>
                    setNewSyllabus({ ...newSyllabus, grade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  value={newSyllabus.year}
                  onChange={(e) =>
                    setNewSyllabus({
                      ...newSyllabus,
                      year: parseInt(e.target.value) || new Date().getFullYear(),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newSyllabus.description}
                  onChange={(e) =>
                    setNewSyllabus({ ...newSyllabus, description: e.target.value })
                  }
                  placeholder="Brief description of the syllabus content"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Document *</label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: PDF, DOC, DOCX
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                className="w-full"
                disabled={uploading || !selectedFile}
              >
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
      </div>

      {syllabi.length > 0 ? (
        <Card>
          <CardContent className="p-0">
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
                {syllabi.map((syllabus) => (
                  <TableRow key={syllabus.id}>
                    <TableCell className="font-medium">{syllabus.title}</TableCell>
                    <TableCell>{syllabus.subjects?.name || "-"}</TableCell>
                    <TableCell>{syllabus.grade || "All Grades"}</TableCell>
                    <TableCell>{syllabus.year}</TableCell>
                    <TableCell>
                      {new Date(syllabus.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {syllabus.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(syllabus.file_url!, "_blank")}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(syllabus.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Syllabi Uploaded</h3>
            <p className="text-muted-foreground mb-4">
              Upload curriculum documents for teachers to access.
            </p>
            <Button onClick={() => setIsAddingOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload First Syllabus
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
