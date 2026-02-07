import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BookOpen, Upload, FileText, Trash2, Loader2, Library
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const grades = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const subjects = [
  "IsiZulu", "English (FAL)", "Afrikaans (SAL)", "Mathematics", "Natural Sciences",
  "Life Orientation", "Dramatic Arts", "Music", "Visual Arts", "History",
  "Geography", "Technology", "Economics", "Accounting", "Physical Sciences",
  "Life Sciences", "Business Studies", "Tourism", "CAT", "IT"
];
const materialTypes = ["E-Book", "Past Paper", "Article"];

interface LibraryMaterial {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  grade: string | null;
  file_url: string;
  description: string | null;
  created_at: string;
}

export default function LibrarianDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [filterType, setFilterType] = useState("all");

  const fetchMaterials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("library_materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMaterials(data);
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleUpload = async () => {
    if (!title || !type || !file || !user) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `library/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("library-materials")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("library-materials")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("library_materials").insert({
      title,
      type,
      subject: subject || null,
      grade: grade || null,
      description: description || null,
      file_url: urlData.publicUrl,
      uploaded_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Material Uploaded!", description: `${title} has been added to the library.` });
      setTitle(""); setType(""); setSubject(""); setGrade(""); setDescription(""); setFile(null);
      fetchMaterials();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("library_materials").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      fetchMaterials();
    }
  };

  const filteredMaterials = filterType === "all"
    ? materials
    : materials.filter((m) => m.type === filterType);

  const tabs = [
    { id: "upload", label: "Upload Material", icon: Upload },
    { id: "manage", label: "Manage Library", icon: Library },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Library className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Librarian Dashboard</h1>
                <p className="text-muted-foreground">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "Library"}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {materials.length} Materials
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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

        <div className="container mx-auto px-4 py-8">
          {activeTab === "upload" && (
            <div className="max-w-2xl mx-auto glass-card p-6 space-y-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">Upload Library Material</h2>
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Material title" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Type *</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Grade</label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">File *</label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.epub,.txt" />
              </div>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload Material
              </Button>
            </div>
          )}

          {activeTab === "manage" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="font-heading text-xl font-semibold text-foreground">Library Materials</h2>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {materialTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filteredMaterials.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">No materials found.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map((m) => (
                    <div key={m.id} className="glass-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-foreground text-sm mb-1">{m.title}</h4>
                      <p className="text-xs text-muted-foreground">{m.type} • {m.subject || "General"} • {m.grade || "All"}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
