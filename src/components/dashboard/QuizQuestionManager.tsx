import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Save, CheckCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  marks: number | null;
  order_num: number | null;
}

interface QuizSubmission {
  id: string;
  user_id: string;
  answers: Record<string, string>;
  score: number | null;
  total_marks: number | null;
  submitted_at: string;
}

interface Props {
  quizId: string;
  quizTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizQuestionManager({ quizId, quizTitle, isOpen, onClose }: Props) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<"questions" | "performance">("questions");

  // New question form
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("multiple_choice");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState("");
  const [qMarks, setQMarks] = useState("1");

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, quizId]);

  const fetchData = async () => {
    setLoading(true);
    const [qRes, sRes, pRes] = await Promise.all([
      supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("order_num"),
      supabase.from("quiz_submissions").select("*").eq("quiz_id", quizId).order("submitted_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, grade"),
    ]);
    if (qRes.data) setQuestions(qRes.data.map(q => ({ ...q, options: q.options as string[] | null })));
    if (sRes.data) setSubmissions(sRes.data.map(s => ({ ...s, answers: s.answers as Record<string, string> })));
    const pMap: Record<string, any> = {};
    if (pRes.data) pRes.data.forEach(p => { pMap[p.user_id] = p; });
    setProfiles(pMap);
    setLoading(false);
  };

  const addQuestion = async () => {
    if (!qText || !qCorrect) {
      toast({ title: "Required", description: "Question text and correct answer are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const options = qType === "multiple_choice" ? qOptions.filter(o => o.trim()) : null;
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: quizId,
        question_text: qText,
        question_type: qType,
        options: options as any,
        correct_answer: qCorrect,
        marks: parseInt(qMarks) || 1,
        order_num: questions.length + 1,
      });
      if (error) throw error;
      toast({ title: "Question Added" });
      setQText(""); setQCorrect(""); setQOptions(["", "", "", ""]); setQMarks("1");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (!error) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast({ title: "Question Deleted" });
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-primary";
    if (pct >= 50) return "text-accent";
    return "text-destructive";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quizTitle}</DialogTitle>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={activeView === "questions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("questions")}
          >
            Questions ({questions.length})
          </Button>
          <Button
            variant={activeView === "performance" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("performance")}
          >
            <Eye className="w-4 h-4 mr-1" /> Performance ({submissions.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : activeView === "questions" ? (
          <div className="space-y-6 mt-2">
            {/* Existing Questions */}
            {questions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Questions</h4>
                {questions.map((q, i) => (
                  <div key={q.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {i + 1}. {q.question_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {q.question_type.replace("_", " ")} • {q.marks} mark(s) • Answer: {q.correct_answer}
                        </p>
                        {q.options && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(q.options as string[]).map((opt, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded text-xs ${
                                  opt === q.correct_answer
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}. {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Question */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground">Add New Question</h4>
              <div>
                <Label>Question Type</Label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-secondary border border-input text-foreground text-sm"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
              <div>
                <Label>Question *</Label>
                <Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Enter question text..." rows={2} />
              </div>
              {qType === "multiple_choice" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {qOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-6">{String.fromCharCode(65 + i)}.</span>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[i] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {qType === "true_false" && (
                <div>
                  <Label>Options</Label>
                  <div className="flex gap-2 mt-1">
                    <span className="px-3 py-1 rounded bg-secondary text-sm">True</span>
                    <span className="px-3 py-1 rounded bg-secondary text-sm">False</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Correct Answer *</Label>
                  <Input value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} placeholder="e.g., A or True" />
                </div>
                <div>
                  <Label>Marks</Label>
                  <Input type="number" value={qMarks} onChange={(e) => setQMarks(e.target.value)} min="1" />
                </div>
              </div>
              <Button onClick={addQuestion} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Question
              </Button>
            </div>
          </div>
        ) : (
          /* Performance View */
          <div className="space-y-4 mt-2">
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No submissions yet.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
                    <p className="text-xs text-muted-foreground">Submissions</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {submissions.filter(s => s.score !== null && s.total_marks && (s.score / s.total_marks) * 100 >= 50).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Passed</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {submissions.length > 0 && submissions[0].total_marks
                        ? `${Math.round(submissions.reduce((s, sub) => s + (sub.score || 0), 0) / submissions.length)}%`
                        : "-"}</p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                </div>

                {/* Individual Results */}
                <div className="space-y-2">
                  {submissions.map((sub) => {
                    const learner = profiles[sub.user_id];
                    const pct = sub.score !== null && sub.total_marks ? Math.round((sub.score / sub.total_marks) * 100) : null;
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {learner ? `${learner.first_name} ${learner.last_name}` : "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {learner?.grade} • {new Date(sub.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${pct !== null ? getScoreColor(pct) : "text-muted-foreground"}`}>
                            {sub.score !== null ? `${sub.score}/${sub.total_marks}` : "Pending"}
                          </p>
                          {pct !== null && (
                            <p className={`text-xs font-bold ${getScoreColor(pct)}`}>{pct}%</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
