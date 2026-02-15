import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  User, CreditCard, FileText, CheckCircle, Clock, DollarSign,
  Loader2, Search, Send, Eye, Upload
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface StatementRequest {
  id: string;
  learner_id: string;
  status: string;
  notes: string | null;
  statement_url: string | null;
  created_at: string;
  learner_name?: string;
  learner_email?: string;
}

interface StudentBalance {
  id: string;
  learner_id: string;
  amount_owed: number;
  last_payment_date: string | null;
  notes: string | null;
  learner_name?: string;
  learner_email?: string;
  learner_grade?: string;
}

interface Subscription {
  id: string;
  learner_id: string;
  month: string;
  year: number;
  amount: number;
  status: string;
  payment_proof_url: string | null;
  learner_name?: string;
  learner_grade?: string;
}

export default function FinanceDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("statements");
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<StatementRequest[]>([]);
  const [balances, setBalances] = useState<StudentBalance[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Balance update modal
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [balanceNotes, setBalanceNotes] = useState("");

  // Statement response modal
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<StatementRequest | null>(null);
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const tabs = [
    { id: "statements", label: "Statement Requests", icon: FileText },
    { id: "balances", label: "Student Balances", icon: DollarSign },
    { id: "subscriptions", label: "Subscriptions (R20)", icon: CreditCard },
  ];

  const fetchData = async () => {
    setLoading(true);
    const [statementsRes, balancesRes, subsRes, profilesRes] = await Promise.all([
      supabase.from("statement_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("student_balances").select("*").order("updated_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, email, grade"),
    ]);

    const profileMap: Record<string, any> = {};
    if (profilesRes.data) {
      profilesRes.data.forEach((p) => { profileMap[p.user_id] = p; });
    }
    setProfiles(profileMap);

    if (statementsRes.data) {
      setStatements(statementsRes.data.map((s) => ({
        ...s,
        learner_name: profileMap[s.learner_id] ? `${profileMap[s.learner_id].first_name} ${profileMap[s.learner_id].last_name}` : "Unknown",
        learner_email: profileMap[s.learner_id]?.email,
      })));
    }

    if (balancesRes.data) {
      setBalances(balancesRes.data.map((b) => ({
        ...b,
        learner_name: profileMap[b.learner_id] ? `${profileMap[b.learner_id].first_name} ${profileMap[b.learner_id].last_name}` : "Unknown",
        learner_email: profileMap[b.learner_id]?.email,
        learner_grade: profileMap[b.learner_id]?.grade,
      })));
    }

    if (subsRes.data) {
      setSubscriptions(subsRes.data.map((s) => ({
        ...s,
        learner_name: profileMap[s.learner_id] ? `${profileMap[s.learner_id].first_name} ${profileMap[s.learner_id].last_name}` : "Unknown",
        learner_grade: profileMap[s.learner_id]?.grade || "",
      })));
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFulfillStatement = async () => {
    if (!selectedStatement || !statementFile) {
      toast({ title: "Missing File", description: "Please upload the statement document.", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${statementFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(`statements/${selectedStatement.learner_id}/${fileName}`, statementFile);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(`statements/${selectedStatement.learner_id}/${fileName}`);
      
      // Update statement request with URL
      const { error } = await supabase
        .from("statement_requests")
        .update({ status: "fulfilled", statement_url: urlData.publicUrl })
        .eq("id", selectedStatement.id);
      
      if (error) throw error;

      // Create targeted notification for the specific learner
      await supabase.from("notifications").insert({
        user_id: selectedStatement.learner_id,
        title: "Your Financial Statement is Ready",
        message: "Your financial statement has been processed and is ready for download.",
        type: "statement",
        link_url: urlData.publicUrl,
        link_label: "Download Statement",
      });
      
      toast({ title: "Statement Sent", description: "The statement has been uploaded and the learner has been notified." });
      setStatementModalOpen(false);
      setStatementFile(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleUpdateBalance = async () => {
    if (!selectedLearner || !newAmount) return;
    const existing = balances.find((b) => b.learner_id === selectedLearner);
    if (existing) {
      const { error } = await supabase
        .from("student_balances")
        .update({ amount_owed: parseFloat(newAmount), notes: balanceNotes || null, updated_by: user?.id })
        .eq("id", existing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Balance Updated" });
        setBalanceModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("student_balances")
        .insert({ learner_id: selectedLearner, amount_owed: parseFloat(newAmount), notes: balanceNotes || null, updated_by: user?.id });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Balance Created" });
        setBalanceModalOpen(false);
        fetchData();
      }
    }
  };

  const handleVerifySubscription = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status, verified_by: user?.id || null })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Subscription ${status}` });
      fetchData();
    }
  };

  const pendingStatements = statements.filter((s) => s.status === "pending");

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Finance Dashboard</h1>
                <p className="text-muted-foreground">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "Finance Department"}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-bold">
                  {pendingStatements.length} Pending Requests
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

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Statement Requests */}
              {activeTab === "statements" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Statement Requests</h2>
                  {statements.length === 0 ? (
                    <div className="glass-card p-8 text-center text-muted-foreground">No statement requests yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {statements.map((s) => (
                        <div key={s.id} className="glass-card p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{s.learner_name}</p>
                            <p className="text-sm text-muted-foreground">{s.learner_email}</p>
                            <p className="text-xs text-muted-foreground">Requested: {new Date(s.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              s.status === "pending" ? "bg-accent/10 text-accent" :
                              s.status === "fulfilled" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>{s.status}</span>
                            {s.status === "pending" && (
                              <Button size="sm" onClick={() => { setSelectedStatement(s); setStatementModalOpen(true); }}>
                                <Send className="w-4 h-4 mr-1" /> Send Statement
                              </Button>
                            )}
                            {s.statement_url && (
                              <a href={s.statement_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Student Balances */}
              {activeTab === "balances" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Student Balances</h2>
                    <Input placeholder="Search students..." className="max-w-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                    {Object.values(profiles)
                      .filter((p: any) => p.grade && (
                        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      ))
                      .map((p: any) => {
                        const balance = balances.find((b) => b.learner_id === p.user_id);
                        return (
                          <div key={p.user_id} className="glass-card p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{p.first_name} {p.last_name}</p>
                              <p className="text-sm text-muted-foreground">{p.grade} • {p.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-foreground">R{balance?.amount_owed?.toFixed(2) || "0.00"}</span>
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedLearner(p.user_id);
                                setNewAmount(balance?.amount_owed?.toString() || "");
                                setBalanceNotes(balance?.notes || "");
                                setBalanceModalOpen(true);
                              }}>Update</Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Subscriptions */}
              {activeTab === "subscriptions" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Monthly Subscriptions (R20)</h2>
                  {subscriptions.length === 0 ? (
                    <div className="glass-card p-8 text-center text-muted-foreground">No subscription payments yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {subscriptions.map((sub) => (
                        <div key={sub.id} className="glass-card p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{sub.learner_name}</p>
                            <p className="text-sm text-muted-foreground">{sub.learner_grade && `${sub.learner_grade} • `}{sub.month} {sub.year} • R{sub.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.payment_proof_url && (
                              <a href={sub.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> Proof</Button>
                              </a>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              sub.status === "verified" ? "bg-primary/10 text-primary" :
                              sub.status === "rejected" ? "bg-destructive/10 text-destructive" :
                              "bg-accent/10 text-accent"
                            }`}>{sub.status}</span>
                            {sub.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => handleVerifySubscription(sub.id, "verified")}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Verify
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleVerifySubscription(sub.id, "rejected")}>Reject</Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Statement Response Modal - Now with file upload */}
        <Dialog open={statementModalOpen} onOpenChange={setStatementModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Statement to {selectedStatement?.learner_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Upload Statement Document *</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {statementFile && <p className="text-xs text-primary mt-1">{statementFile.name}</p>}
              </div>
              <Button onClick={handleFulfillStatement} className="w-full" disabled={uploading || !statementFile}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Statement
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Balance Update Modal */}
        <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Student Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Amount Owed (R)</Label>
                <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={balanceNotes} onChange={(e) => setBalanceNotes(e.target.value)} placeholder="Any notes..." rows={3} />
              </div>
              <Button onClick={handleUpdateBalance} className="w-full">Update Balance</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
