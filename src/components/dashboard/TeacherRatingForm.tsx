import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Star, Loader2, CheckCircle } from "lucide-react";

interface Teacher {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface Subject {
  id: string;
  name: string;
}

export function TeacherRatingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch teachers using security definer function (bypasses RLS)
    const { data: teacherProfiles } = await supabase.rpc("get_teacher_profiles");
    if (teacherProfiles) {
      setTeachers(teacherProfiles as Teacher[]);
    }

    // Fetch all subjects
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");

    if (subjectsData) {
      setSubjects(subjectsData);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !selectedTeacher || !selectedSubject || rating === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a teacher, subject, and provide a rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("teacher_ratings").insert({
        teacher_id: selectedTeacher,
        learner_id: user.id,
        subject: subjects.find((s) => s.id === selectedSubject)?.name || "",
        rating: rating,
        feedback: feedback || null,
        is_anonymous: true,
        term: getCurrentTerm(),
        year: new Date().getFullYear(),
      });

      if (error) throw error;

      toast({
        title: "Rating Submitted",
        description: "Thank you for your anonymous feedback!",
      });

      // Reset form
      setSelectedTeacher("");
      setSelectedSubject("");
      setRating(0);
      setFeedback("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentTerm = () => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return "Term 1";
    if (month >= 3 && month <= 5) return "Term 2";
    if (month >= 6 && month <= 8) return "Term 3";
    return "Term 4";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Star className="w-4 h-4" />
          Rate a Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Rate Your Teacher
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Your feedback is anonymous and helps improve teaching quality.
            </p>

            <div>
              <label className="text-sm font-medium">Select Teacher *</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.user_id} value={teacher.user_id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">Your Rating *</label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? "text-accent fill-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-muted-foreground">
                  {rating > 0 && (
                    <>
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </>
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Feedback (Optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about this teacher's teaching style, helpfulness, etc."
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your feedback will remain anonymous.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={submitting || !selectedTeacher || !selectedSubject || rating === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Rating
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
