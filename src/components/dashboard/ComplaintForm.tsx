import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Send, Loader2, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Complaint {
  id: string;
  grade: string;
  subject: string | null;
  complaint_text: string;
  is_anonymous: boolean;
  status: string;
  response: string | null;
  created_at: string;
}

export function ComplaintForm() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("learner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setComplaints(data as Complaint[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !complaintText.trim()) {
      toast({ title: "Missing Information", description: "Please enter your complaint.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("complaints").insert({
      learner_id: user.id,
      grade: profile?.grade || "Unknown",
      subject: subject || null,
      complaint_text: complaintText,
      is_anonymous: isAnonymous,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Complaint Submitted", description: "Your complaint has been sent to the Deputy Principal and Principal." });
      setComplaintText("");
      setSubject("");
      setIsAnonymous(false);
      // Refresh
      const { data } = await supabase.from("complaints").select("*").eq("learner_id", user.id).order("created_at", { ascending: false });
      if (data) setComplaints(data as Complaint[]);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Lodge a Complaint
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your complaint will be sent to the Deputy Principal and Principal. You can choose to remain anonymous.
        </p>
        <div className="space-y-4">
          <div>
            <Label>Subject (Optional)</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Classroom issue, Teacher concern..." />
          </div>
          <div>
            <Label>Your Complaint *</Label>
            <Textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)} placeholder="Describe your complaint in detail..." rows={4} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label className="text-sm">Submit anonymously (only your grade will be shown)</Label>
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Complaint
          </Button>
        </div>
      </div>

      {complaints.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">My Complaints</h3>
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {c.subject && <p className="font-medium text-foreground text-sm">{c.subject}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.status === "pending" ? "bg-accent/10 text-accent" :
                    c.status === "resolved" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {c.status === "pending" ? <Clock className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.complaint_text}</p>
                {c.response && (
                  <div className="mt-3 p-3 rounded bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary">Response:</p>
                    <p className="text-sm text-muted-foreground">{c.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
