import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Clock, CheckCircle } from "lucide-react";

interface Complaint {
  id: string;
  learner_id: string;
  grade: string;
  subject: string | null;
  complaint_text: string;
  is_anonymous: boolean;
  status: string;
  response: string | null;
  created_at: string;
}

interface PrincipalComplaintsProps {
  complaints: Complaint[];
  profiles: Record<string, any>;
  onRefresh: () => void;
}

export function PrincipalComplaints({ complaints, profiles, onRefresh }: PrincipalComplaintsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaintResponse, setComplaintResponse] = useState("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const handleRespond = async (complaintId: string) => {
    if (!complaintResponse.trim()) return;
    const { error } = await supabase.from('complaints').update({
      status: 'resolved',
      response: complaintResponse,
      responded_by: user?.id,
    }).eq('id', complaintId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Response Sent", description: "The complaint has been resolved." });
      setComplaintResponse("");
      setRespondingTo(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Student Complaints</h2>
      {complaints.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">No complaints received yet.</div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => {
            const learner = profiles[c.learner_id];
            return (
              <div key={c.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {c.is_anonymous ? `Anonymous (${c.grade})` : learner ? `${learner.first_name} ${learner.last_name} (${c.grade})` : c.grade}
                    </p>
                    {c.subject && <p className="text-sm text-muted-foreground">Subject: {c.subject}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.status === "pending" ? "bg-accent/10 text-accent-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {c.status === "pending" ? <Clock className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-3">{c.complaint_text}</p>

                {c.response && (
                  <div className="p-3 rounded bg-primary/5 border border-primary/20 mb-3">
                    <p className="text-xs font-medium text-primary">Response:</p>
                    <p className="text-sm text-muted-foreground">{c.response}</p>
                  </div>
                )}

                {c.status === "pending" && (
                  <div className="space-y-2">
                    {respondingTo === c.id ? (
                      <>
                        <Textarea value={complaintResponse} onChange={(e) => setComplaintResponse(e.target.value)} placeholder="Type your response..." rows={3} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRespond(c.id)}>
                            <Send className="w-4 h-4 mr-1" /> Send Response
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setComplaintResponse(""); }}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRespondingTo(c.id)}>
                        <MessageSquare className="w-4 h-4 mr-1" /> Respond
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
