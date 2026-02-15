import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, CheckCircle, XCircle, Clock, Trophy, ArrowRight, ArrowLeft, RotateCcw,
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  marks: number | null;
  order_num: number | null;
}

interface Props {
  quizId: string;
  quizTitle: string;
  quizSubject: string;
  quizDuration: number | null;
  quizTotalMarks: number | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function QuizPlayer({
  quizId, quizTitle, quizSubject, quizDuration, quizTotalMarks,
  isOpen, onClose, onComplete,
}: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [previousResult, setPreviousResult] = useState<{ score: number; total_marks: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
      checkPreviousAttempt();
    }
    return () => { setSubmitted(false); setAnswers({}); setCurrentQ(0); setTimeLeft(null); };
  }, [isOpen, quizId]);

  // Timer
  useEffect(() => {
    if (!isOpen || submitted || alreadyAttempted || timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, submitted, alreadyAttempted, timeLeft]);

  const checkPreviousAttempt = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("quiz_submissions")
      .select("score, total_marks")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .limit(1);
    if (data && data.length > 0) {
      setAlreadyAttempted(true);
      setPreviousResult({ score: data[0].score ?? 0, total_marks: data[0].total_marks ?? 0 });
    } else {
      setAlreadyAttempted(false);
      setPreviousResult(null);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_num");
    if (data) {
      setQuestions(data.map(q => ({ ...q, options: q.options as string[] | null })));
      if (quizDuration) setTimeLeft(quizDuration * 60);
    }
    setLoading(false);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);

    let earned = 0;
    let total = 0;
    questions.forEach(q => {
      const qMarks = q.marks || 1;
      total += qMarks;
      const userAnswer = (answers[q.id] || "").trim().toLowerCase();
      const correctAnswer = q.correct_answer.trim().toLowerCase();
      if (userAnswer === correctAnswer) earned += qMarks;
    });

    setScore(earned);
    setTotalMarks(total);

    if (user) {
      await supabase.from("quiz_submissions").insert({
        quiz_id: quizId,
        user_id: user.id,
        answers: answers as any,
        score: earned,
        total_marks: total,
      });
    }

    setSubmitted(true);
    setSubmitting(false);
    toast({ title: "Quiz Submitted!", description: `You scored ${earned}/${total}` });
    onComplete?.();
  }, [answers, questions, quizId, user, submitting, submitted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-primary";
    if (pct >= 50) return "text-accent";
    return "text-destructive";
  };

  if (!isOpen) return null;

  const q = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{quizTitle}</span>
            {timeLeft !== null && !submitted && !alreadyAttempted && (
              <span className={`text-sm font-mono px-3 py-1 rounded-full ${
                timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
              }`}>
                <Clock className="w-3 h-3 inline mr-1" />
                {formatTime(timeLeft)}
              </span>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{quizSubject}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>This quiz has no questions yet.</p>
          </div>
        ) : alreadyAttempted && !submitted ? (
          <div className="text-center py-8 space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Already Attempted</h3>
            {previousResult && (
              <>
                <p className={`text-3xl font-bold ${getScoreColor(
                  (previousResult.score / previousResult.total_marks) * 100
                )}`}>
                  {previousResult.score}/{previousResult.total_marks}
                </p>
                <p className={`text-lg font-semibold ${getScoreColor(
                  (previousResult.score / previousResult.total_marks) * 100
                )}`}>
                  {Math.round((previousResult.score / previousResult.total_marks) * 100)}%
                </p>
              </>
            )}
            <p className="text-sm text-muted-foreground">You have already completed this quiz.</p>
          </div>
        ) : submitted ? (
          /* Results View */
          <div className="space-y-6">
            <div className="text-center py-4 space-y-2">
              <Trophy className="w-16 h-16 mx-auto text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Quiz Complete!</h3>
              <p className={`text-4xl font-bold ${getScoreColor((score / totalMarks) * 100)}`}>
                {score}/{totalMarks}
              </p>
              <p className={`text-xl font-semibold ${getScoreColor((score / totalMarks) * 100)}`}>
                {Math.round((score / totalMarks) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {(score / totalMarks) * 100 >= 50 ? "🎉 Passed!" : "Keep practicing!"}
              </p>
            </div>

            {/* Answer Review */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Answer Review</h4>
              {questions.map((question, i) => {
                const userAns = (answers[question.id] || "").trim().toLowerCase();
                const correctAns = question.correct_answer.trim().toLowerCase();
                const isCorrect = userAns === correctAns;
                return (
                  <div key={question.id} className={`p-3 rounded-lg border ${
                    isCorrect ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
                  }`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {i + 1}. {question.question_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your answer: <span className={isCorrect ? "text-primary font-bold" : "text-destructive font-bold"}>
                            {answers[question.id] || "(no answer)"}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-primary mt-0.5">
                            Correct answer: <span className="font-bold">{question.correct_answer}</span>
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">
                        {isCorrect ? question.marks || 1 : 0}/{question.marks || 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Quiz Taking View */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>{answeredCount}/{questions.length} answered</span>
            </div>
            <Progress value={progress} className="h-2" />

            {q && (
              <div className="space-y-4 py-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-medium text-foreground flex-1">
                    {currentQ + 1}. {q.question_text}
                  </h3>
                  <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                    {q.marks || 1} mark{(q.marks || 1) > 1 ? "s" : ""}
                  </span>
                </div>

                {q.question_type === "multiple_choice" && q.options && (
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                    className="space-y-2"
                  >
                    {(q.options as string[]).map((opt, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        answers[q.id] === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}>
                        <RadioGroupItem value={opt} id={`q${q.id}-opt${idx}`} />
                        <Label htmlFor={`q${q.id}-opt${idx}`} className="cursor-pointer flex-1 text-sm">
                          {String.fromCharCode(65 + idx)}. {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.question_type === "true_false" && (
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                    className="space-y-2"
                  >
                    {["True", "False"].map((opt) => (
                      <div key={opt} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        answers[q.id] === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}>
                        <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} />
                        <Label htmlFor={`q${q.id}-${opt}`} className="cursor-pointer flex-1 text-sm">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.question_type === "short_answer" && (
                  <Input
                    placeholder="Type your answer..."
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  />
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(prev => prev - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              {currentQ < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentQ(prev => prev + 1)}
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-primary"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Submit Quiz
                </Button>
              )}
            </div>

            {/* Question Navigator */}
            <div className="flex flex-wrap gap-1 pt-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                    i === currentQ
                      ? "bg-primary text-primary-foreground"
                      : answers[questions[i].id]
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
