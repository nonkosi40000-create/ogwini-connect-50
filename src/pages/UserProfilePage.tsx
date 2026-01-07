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
  CreditCard, GraduationCap, LogOut, Edit2, X, Check 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const bankingDetails = {
  bankName: "FNB (First National Bank)",
  accountName: "Ogwini Comprehensive Technical High School",
  accountNumber: "62890547123",
  branchCode: "250655",
};

export default function UserProfilePage() {
  const { user, profile, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
      setIsEditing(false);
    }
    
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Mock academic reports - in real app, fetch from database
  const academicReports = [
    { id: 1, term: "Term 1 2024", subject: "Mathematics", mark: 78, grade: "B" },
    { id: 2, term: "Term 1 2024", subject: "English", mark: 85, grade: "A" },
    { id: 3, term: "Term 1 2024", subject: "Science", mark: 72, grade: "B" },
    { id: 4, term: "Term 1 2024", subject: "Technical Drawing", mark: 88, grade: "A" },
  ];

  const downloadReport = (term: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${term} report...`,
    });
    // In real app, this would trigger actual file download
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 bg-dark text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-white">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </div>
                <div>
                  <h1 className="font-heading text-3xl font-bold">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <p className="text-white/70">
                    Student ID: {profile?.id_number || "N/A"}
                  </p>
                  {profile?.grade && (
                    <p className="text-primary font-medium">{profile.grade} {profile.class}</p>
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

      {/* Profile Content */}
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
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                      <Check className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
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
                  {isEditing ? (
                    <Input
                      value={editableData.email}
                      onChange={(e) => setEditableData({ ...editableData, email: e.target.value })}
                      disabled
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground">{profile?.email}</p>
                  )}
                  {isEditing && <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={editableData.phone}
                      onChange={(e) => setEditableData({ ...editableData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground">{profile?.phone || "Not provided"}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-sm">Home Address</Label>
                  {isEditing ? (
                    <Input
                      value={editableData.address}
                      onChange={(e) => setEditableData({ ...editableData, address: e.target.value })}
                      placeholder="Enter home address"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground">{profile?.address || "Not provided"}</p>
                  )}
                </div>
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
                      <Input
                        value={editableData.parent_phone}
                        onChange={(e) => setEditableData({ ...editableData, parent_phone: e.target.value })}
                        placeholder="Enter parent phone"
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{profile?.parent_phone || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Parent Email</Label>
                    {isEditing ? (
                      <Input
                        value={editableData.parent_email}
                        onChange={(e) => setEditableData({ ...editableData, parent_email: e.target.value })}
                        placeholder="Enter parent email"
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{profile?.parent_email || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Reports */}
            <div className="glass-card p-6 lg:p-8">
              <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Reports
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Term 1 2024 Report</p>
                    <p className="text-sm text-muted-foreground">Available for download</p>
                  </div>
                  <Button size="sm" onClick={() => downloadReport("Term 1 2024")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subject</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mark</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicReports.map((report) => (
                        <tr key={report.id} className="border-b border-border last:border-0">
                          <td className="py-3 px-4 text-foreground">{report.subject}</td>
                          <td className="py-3 px-4 text-foreground">{report.mark}%</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              report.grade === "A" ? "bg-primary/10 text-primary" :
                              report.grade === "B" ? "bg-accent/10 text-accent" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {report.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                      <span className="text-muted-foreground">Tuition 2024</span>
                      <span className="font-medium text-foreground">R 15,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-medium text-primary">R 10,000.00</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-medium text-foreground">Balance Due</span>
                      <span className="font-bold text-destructive">R 5,000.00</span>
                    </div>
                  </div>
                </div>

                <div className="bg-dark text-white rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Bank Details for Payment</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Bank</span>
                      <span className="font-medium">{bankingDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Account Name</span>
                      <span className="font-medium text-xs">{bankingDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Account Number</span>
                      <span className="font-medium">{bankingDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Branch Code</span>
                      <span className="font-medium">{bankingDetails.branchCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Reference</span>
                      <span className="font-medium text-primary">{profile?.id_number || "Your ID Number"}</span>
                    </div>
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
