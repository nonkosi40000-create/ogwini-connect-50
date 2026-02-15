import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CreditCard, CheckCircle, Clock, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Subscription {
  id: string;
  month: string;
  year: number;
  amount: number;
  status: string;
  payment_proof_url: string | null;
}

export function SubscriptionPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [file, setFile] = useState<File | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("learner_id", user.id)
        .eq("year", currentYear)
        .order("created_at", { ascending: false });
      if (data) setSubscriptions(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !file || !selectedMonth) return;

    // Check for existing
    const existing = subscriptions.find((s) => s.month === selectedMonth && s.year === currentYear);
    if (existing) {
      toast({ title: "Already submitted", description: `You already submitted for ${selectedMonth}.`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    
    // Fetch profile to get name and grade for the file reference
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, last_name, grade")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const nameRef = profileData
      ? `${profileData.first_name}_${profileData.last_name}_${(profileData.grade || 'NoGrade').replace(/\s/g, '')}`
      : user.id;
    
    const filePath = `subscriptions/${nameRef}_${currentYear}_${selectedMonth}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("subscription-proofs")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("subscription-proofs").getPublicUrl(filePath);

    const { error } = await supabase.from("subscriptions").insert({
      learner_id: user.id,
      month: selectedMonth,
      year: currentYear,
      amount: 20,
      payment_proof_url: urlData.publicUrl,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment Submitted!", description: "Your proof of payment has been sent for verification." });
      setFile(null);
      // Refresh
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("learner_id", user.id)
        .eq("year", currentYear)
        .order("created_at", { ascending: false });
      if (data) setSubscriptions(data);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Submit payment */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Monthly Subscription - R20.00
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Submit your proof of payment for the monthly R20 subscription fee.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-foreground">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Proof of Payment</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png" />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !file}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Submit Payment
        </Button>
      </div>

      {/* Payment history */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Payment History ({currentYear})</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {months.map((month) => {
            const sub = subscriptions.find((s) => s.month === month);
            return (
              <div
                key={month}
                className={`p-3 rounded-lg text-center text-xs font-medium border ${
                  sub?.status === "verified"
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : sub?.status === "pending"
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : sub?.status === "rejected"
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                <p>{month.substring(0, 3)}</p>
                {sub ? (
                  <div className="mt-1">
                    {sub.status === "verified" && <CheckCircle className="w-4 h-4 mx-auto" />}
                    {sub.status === "pending" && <Clock className="w-4 h-4 mx-auto" />}
                    {sub.status === "rejected" && <span className="text-xs">✗</span>}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
