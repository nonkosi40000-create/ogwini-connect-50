import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Loader2, CheckCircle, Clock, Eye, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Submission {
  id: string;
  learner_id: string;
  material_id: string | null;
  file_url: string;
  notes: string | null;
  status: string;
  marked_file_url: string | null;
  marks_obtained: number | null;
  total_marks: number | null;
  teacher_feedback: string | null;
  created_at: string;
}

export function TeacherHomeworkReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [materials, setMaterials] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [marksObtained, setMarksObtained] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [feedback, setFeedback] = useState("");
  const [markedFile, setMarkedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [subsRes, profilesRes, matsRes] = await Promise.all([
        supabase.from("homework_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, first_name, last_name, grade"),
        supabase.from("learning_materials").select("id, title, subject, grade"),
      ]);

      if (subsRes.data) setSubmissions(subsRes.data as Submission[]);
      
      const pMap: Record<string, any> = {};
      if (profilesRes.data) profilesRes.data.forEach(p => { pMap[p.user_id] = p; });
      setProfiles(pMap);

      const mMap: Record<string, any> = {};
      if (matsRes.data) matsRes.data.forEach(m => { mMap[m.id] = m; });
      setMaterials(mMap);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleMark = async () => {
    if (!selectedSub || !marksObtained) return;
    setUploading(true);
    try {
      let markedFileUrl: string | null = null;
      if (markedFile) {
        const fileName = `${Date.now()}-${markedFile.name}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(`marked/${selectedSub.learner_id}/${fileName}`, markedFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(`marked/${selectedSub.learner_id}/${fileName}`);
        markedFileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("homework_submissions").update({
        status: "marked",
        marks_obtained: parseFloat(marksObtained),
        total_marks: parseFloat(totalMarks),
        teacher_feedback: feedback || null,
        marked_file_url: markedFileUrl,
        marked_by: user?.id,
      }).eq("id", selectedSub.id);

      if (error) throw error;

      toast({ title: "Marked!", description: "The submission has been marked and feedback sent." });
      setMarkModalOpen(false);
      setMarksObtained("");
      setFeedback("");
      setMarkedFile(null);
      
      // Refresh
      const { data } = await supabase.from("homework_submissions").select("*").order("created_at", { ascending: false });
      if (data) setSubmissions(data as Submission[]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-foreground">Student Submissions</h3>
      {submissions.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">No submissions yet.</div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const learner = profiles[sub.learner_id];
            const material = sub.material_id ? materials[sub.material_id] : null;
            return (
              <div key={sub.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {learner ? `${learner.first_name} ${learner.last_name}` : "Unknown"}
                    {learner?.grade && <span className="text-muted-foreground text-sm"> • {learner.grade}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {material?.title || "Assignment"} {material?.subject && `• ${material.subject}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    sub.status === "marked" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  }`}>
                    {sub.status === "marked" ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <Clock className="w-3 h-3 inline mr-1" />}
                    {sub.status}
                  </span>
                  <a href={sub.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> View</Button>
                  </a>
                  {sub.status !== "marked" && (
                    <Button size="sm" onClick={() => { setSelectedSub(sub); setMarkModalOpen(true); }}>
                      <Send className="w-4 h-4 mr-1" /> Mark
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Modal */}
      <Dialog open={markModalOpen} onOpenChange={setMarkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marks Obtained *</Label>
                <Input type="number" value={marksObtained} onChange={(e) => setMarksObtained(e.target.value)} />
              </div>
              <div>
                <Label>Total Marks</Label>
                <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback for student..." rows={3} />
            </div>
            <div>
              <Label>Upload Marked Copy (Optional)</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => setMarkedFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <Button onClick={handleMark} className="w-full" disabled={uploading || !marksObtained}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Submit Marks
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
