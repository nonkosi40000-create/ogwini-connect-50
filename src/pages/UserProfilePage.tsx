import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Mail, Phone, MapPin, Save, Download, FileText, 
  CreditCard, GraduationCap, LogOut, Edit2, X, Check, Loader2, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const bankingDetails = {
  bankName: "FNB (First National Bank)",
  accountName: "Ogwini Comprehensive Technical High School",
  accountNumber: "62890547123",
  branchCode: "250655",
};

interface AcademicReport {
  id: string;
  title: string;
  term: string | null;
  year: number | null;
  file_url: string;
  created_at: string;
}

interface RegistrationDoc {
  id_document_url: string | null;
  proof_of_address_url: string | null;
  report_url: string | null;
  payment_proof_url: string | null;
}

export default function UserProfilePage() {
  const { user, profile, signOut, loading, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reports, setReports] = useState<AcademicReport[]>([]);
  const [regDocs, setRegDocs] = useState<RegistrationDoc | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  const [editableData, setEditableData] = useState({
    phone: "",
    email: "",
    address: "",
    parent_phone: "",
    parent_email: "",
  });

  useEffect(() => {
    if (profile) {
      setEditableData({
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        parent_phone: profile.parent_phone || "",
        parent_email: profile.parent_email || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchExtra = async () => {
      setLoadingData(true);
      const [reportsRes, regRes, balanceRes] = await Promise.all([
        supabase.from("academic_reports").select("*").eq("learner_id", user.id).order("created_at", { ascending: false }),
        supabase.from("registrations").select("id_document_url, proof_of_address_url, report_url, payment_proof_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("student_balances").select("amount_owed").eq("learner_id", user.id).maybeSingle(),
      ]);
      if (reportsRes.data) setReports(reportsRes.data as AcademicReport[]);
      if (regRes.data) setRegDocs(regRes.data);
      if (balanceRes.data) setBalance(balanceRes.data.amount_owed);
      setLoadingData(false);
    };
    fetchExtra();
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: editableData.phone,
        address: editableData.address,
        parent_phone: editableData.parent_phone,
        parent_email: editableData.parent_email,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your information has been saved successfully." });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const docLinks = [
    { label: "ID Document", url: regDocs?.id_document_url },
    { label: "Proof of Address", url: regDocs?.proof_of_address_url },
    { label: "School Report", url: regDocs?.report_url },
    { label: "Payment Proof", url: regDocs?.payment_proof_url },
  ].filter(d => d.url);

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </div>
                <div className="text-white">
                  <h1 className="font-heading text-3xl font-bold">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <p className="text-white/70">
                    Student ID: {profile?.id_number || "N/A"}
                  </p>
                  {profile?.grade && (
                    <p className="text-white/90 font-medium">{profile.grade} {profile.class ? `• ${profile.class}` : ''}</p>
                  )}
                </div>
              </div>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Personal Information */}
            <div className="glass-card p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h2>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                      <Check className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-sm">Full Name</Label>
                  <p className="font-medium text-foreground">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">ID Number</Label>
                  <p className="font-medium text-foreground">{profile?.id_number || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email Address</Label>
                  <p className="font-medium text-foreground">{profile?.email}</p>
                  {isEditing && <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Phone Number</Label>
                  {isEditing ? (
                    <Input value={editableData.phone} onChange={(e) => setEditableData({ ...editableData, phone: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="font-medium text-foreground">{profile?.phone || "Not provided"}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-sm">Home Address</Label>
                  {isEditing ? (
                    <Input value={editableData.address} onChange={(e) => setEditableData({ ...editableData, address: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="font-medium text-foreground">{profile?.address || "Not provided"}</p>
                  )}
                </div>
                {profile?.grade && (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">Grade</Label>
                      <p className="font-medium text-foreground">{profile.grade}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Class</Label>
                      <p className="font-medium text-foreground">{profile.class || "N/A"}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Parent/Guardian Info */}
              <div className="border-t border-border mt-6 pt-6">
                <h3 className="font-semibold text-foreground mb-4">Parent/Guardian Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Parent/Guardian Name</Label>
                    <p className="font-medium text-foreground">{profile?.parent_name || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Parent Phone</Label>
                    {isEditing ? (
                      <Input value={editableData.parent_phone} onChange={(e) => setEditableData({ ...editableData, parent_phone: e.target.value })} className="mt-1" />
                    ) : (
                      <p className="font-medium text-foreground">{profile?.parent_phone || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Parent Email</Label>
                    {isEditing ? (
                      <Input value={editableData.parent_email} onChange={(e) => setEditableData({ ...editableData, parent_email: e.target.value })} className="mt-1" />
                    ) : (
                      <p className="font-medium text-foreground">{profile?.parent_email || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Documents (downloadable) */}
            {docLinks.length > 0 && (
              <div className="glass-card p-6 lg:p-8">
                <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-primary" />
                  Uploaded Documents
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {docLinks.map((doc) => (
                    <div key={doc.label} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground text-sm">{doc.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={doc.url!} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> View</Button>
                        </a>
                        <a href={doc.url!} download>
                          <Button size="sm"><Download className="w-4 h-4 mr-1" /> Download</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Reports */}
            <div className="glass-card p-6 lg:p-8">
              <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Reports
              </h2>
              {loadingData ? (
                <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
              ) : reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.term && `${report.term} • `}{report.year}
                        </p>
                      </div>
                      <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm"><Download className="w-4 h-4 mr-2" /> Download</Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No academic reports uploaded yet.</p>
                  <p className="text-sm">Reports will appear here once your teachers upload them.</p>
                </div>
              )}
            </div>

            {/* School Fees & Banking */}
            <div className="glass-card p-6 lg:p-8">
              <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                School Fees & Banking Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4">Outstanding Fees</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className="font-bold text-xl text-foreground">
                        R{balance !== null ? balance.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Bank Details for Payment</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Bank", value: bankingDetails.bankName },
                      { label: "Account Name", value: bankingDetails.accountName },
                      { label: "Account Number", value: bankingDetails.accountNumber },
                      { label: "Branch Code", value: bankingDetails.branchCode },
                      { label: "Reference", value: profile?.id_number || "Your ID Number" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-white/70">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
