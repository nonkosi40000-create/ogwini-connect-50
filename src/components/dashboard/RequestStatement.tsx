import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Send, CheckCircle, Clock, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StatementRequest {
  id: string;
  status: string;
  statement_url: string | null;
  created_at: string;
  notes: string | null;
}

export function RequestStatement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<StatementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("statement_requests")
        .select("*")
        .eq("learner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setRequests(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleRequest = async () => {
    if (!user) return;
    // Check for existing pending
    const pending = requests.find((r) => r.status === "pending");
    if (pending) {
      toast({ title: "Request Already Pending", description: "You already have a pending statement request.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("statement_requests").insert({
      learner_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Sent!", description: "The finance department will process your statement request." });
      // Refresh
      const { data } = await supabase
        .from("statement_requests")
        .select("*")
        .eq("learner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setRequests(data);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 text-center">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Request Financial Statement</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click below to request your financial statement from the finance department.
        </p>
        <Button onClick={handleRequest} disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Request Statement
        </Button>
      </div>

      {requests.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">My Requests</h3>
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Statement Request
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    r.status === "pending" ? "bg-accent/10 text-accent" :
                    r.status === "fulfilled" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {r.status === "pending" ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {r.status}
                  </span>
                  {r.statement_url && (
                    <a href={r.statement_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
