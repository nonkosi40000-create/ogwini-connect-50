import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Loader2, FileText, CheckCircle, Clock, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Assignment {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  type: string;
  file_url: string;
  due_date: string | null;
}

interface Submission {
  id: string;
  material_id: string | null;
  file_url: string;
  status: string;
  marked_file_url: string | null;
  marks_obtained: number | null;
  total_marks: number | null;
  teacher_feedback: string | null;
  created_at: string;
}

export function HomeworkSubmissions() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const learnerGrade = profile?.grade || "";

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [assignRes, subRes] = await Promise.all([
        supabase.from("learning_materials").select("*")
          .in("type", ["activity", "worksheet", "assignment"])
          .order("created_at", { ascending: false }),
        supabase.from("homework_submissions").select("*").eq("learner_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (assignRes.data) setAssignments(
        (assignRes.data as any[]).filter((a: any) => !a.grade || a.grade === learnerGrade)
      );
      if (subRes.data) setSubmissions(subRes.data as Submission[]);
      setLoading(false);
    };
    fetchData();
  }, [user, learnerGrade]);

  const handleSubmit = async () => {
    if (!user || !file || !selectedAssignment) return;
    setSubmitting(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(`submissions/${user.id}/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(`submissions/${user.id}/${fileName}`);

      const { error } = await supabase.from("homework_submissions").insert({
        learner_id: user.id,
        material_id: selectedAssignment.id,
        file_url: urlData.publicUrl,
        notes: notes || null,
      });
      if (error) throw error;

      toast({ title: "Submitted!", description: `Your work for "${selectedAssignment.title}" has been submitted.` });
      setSubmitModalOpen(false);
      setFile(null);
      setNotes("");
      // Refresh
      const { data } = await supabase.from("homework_submissions").select("*").eq("learner_id", user.id).order("created_at", { ascending: false });
      if (data) setSubmissions(data as Submission[]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Available Assignments */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Available Assignments & Activities</h3>
        {assignments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No assignments available yet.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const submitted = submissions.find(s => s.material_id === a.id);
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject} • {a.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> View</Button>
                    </a>
                    {submitted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        <CheckCircle className="w-3 h-3 inline mr-1" /> Submitted
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => { setSelectedAssignment(a); setSubmitModalOpen(true); }}>
                        <Upload className="w-4 h-4 mr-1" /> Submit
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Submissions with Feedback */}
      {submissions.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">My Submissions</h3>
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {assignments.find(a => a.id === s.material_id)?.title || "Assignment"}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    s.status === "marked" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  }`}>
                    {s.status === "marked" ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <Clock className="w-3 h-3 inline mr-1" />}
                    {s.status}
                  </span>
                </div>
                {s.marks_obtained !== null && (
                  <p className="text-sm font-bold text-foreground">
                    Mark: {s.marks_obtained}/{s.total_marks} ({Math.round((s.marks_obtained / (s.total_marks || 1)) * 100)}%)
                  </p>
                )}
                {s.teacher_feedback && (
                  <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary">Teacher Feedback</p>
                    <p className="text-sm text-muted-foreground">{s.teacher_feedback}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <a href={s.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1" /> My Work</Button>
                  </a>
                  {s.marked_file_url && (
                    <a href={s.marked_file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm"><Download className="w-4 h-4 mr-1" /> Marked Copy</Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Modal */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> Submit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedAssignment && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="font-medium text-foreground">{selectedAssignment.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAssignment.subject}</p>
              </div>
            )}
            <div>
              <Label>Upload Your Work *</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.zip,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for your teacher..." rows={3} />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={submitting || !file}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
