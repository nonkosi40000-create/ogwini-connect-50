import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  BookOpen,
  FileText,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Upload,
  Loader2,
  Star,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SyllabusUpload } from "@/components/dashboard/SyllabusUpload";
import { TeacherRatings } from "@/components/dashboard/TeacherRatings";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department_id: string;
}

interface CurriculumPolicy {
  id: string;
  department_id: string;
  title: string;
  description: string | null;
  policy_document_url: string | null;
  status: string;
  created_at: string;
}

const HODDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [policies, setPolicies] = useState<CurriculumPolicy[]>([]);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    description: "",
    status: "draft",
  });
  const [uploading, setUploading] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "syllabus", label: "Syllabus", icon: FileText },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "policies", label: "Curriculum Policies", icon: FileText },
    { id: "ratings", label: "Teacher Ratings", icon: Star },
    { id: "teachers", label: "Department Teachers", icon: Users },
  ];

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get the department this HOD is assigned to
      const { data: deptHeadData, error: deptHeadError } = await supabase
        .from("department_heads")
        .select("department_id")
        .eq("user_id", user.id)
        .single();

      if (deptHeadError || !deptHeadData) {
        toast({
          title: "No Department Assigned",
          description: "You are not assigned to any department yet.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get department details
      const { data: deptData } = await supabase
        .from("departments")
        .select("*")
        .eq("id", deptHeadData.department_id)
        .single();

      if (deptData) {
        setDepartment(deptData);
      }

      // Get subjects in this department
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("department_id", deptHeadData.department_id);

      if (subjectsData) {
        setSubjects(subjectsData);
      }

      // Get curriculum policies
      const { data: policiesData } = await supabase
        .from("curriculum_policies")
        .select("*")
        .eq("department_id", deptHeadData.department_id)
        .order("created_at", { ascending: false });

      if (policiesData) {
        setPolicies(policiesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async () => {
    if (!department || !user) return;

    try {
      const { error } = await supabase.from("curriculum_policies").insert({
        department_id: department.id,
        title: newPolicy.title,
        description: newPolicy.description,
        status: newPolicy.status,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Policy Created",
        description: "Curriculum policy has been created successfully.",
      });

      setNewPolicy({ title: "", description: "", status: "draft" });
      setIsAddingPolicy(false);
      fetchData();
    } catch (error) {
      console.error("Error adding policy:", error);
      toast({
        title: "Error",
        description: "Failed to create policy.",
        variant: "destructive",
      });
    }
  };

  const handlePublishPolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from("curriculum_policies")
        .update({ status: "published" })
        .eq("id", policyId);

      if (error) throw error;

      toast({
        title: "Policy Published",
        description: "The policy is now visible to all staff.",
      });

      fetchData();
    } catch (error) {
      console.error("Error publishing policy:", error);
      toast({
        title: "Error",
        description: "Failed to publish policy.",
        variant: "destructive",
      });
    }
  };

  const handleUploadDocument = async (
    policyId: string,
    file: File
  ) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${policyId}-${Date.now()}.${fileExt}`;
      const filePath = `curriculum-policies/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("curriculum_policies")
        .update({ policy_document_url: publicUrl })
        .eq("id", policyId);

      if (updateError) throw updateError;

      toast({
        title: "Document Uploaded",
        description: "Policy document has been uploaded successfully.",
      });

      fetchData();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">HOD Dashboard</h1>
            <p className="text-primary-foreground/80 mt-2">
              Welcome, {profile?.first_name || "Head of Department"}
            </p>
            {department && (
              <Badge variant="secondary" className="mt-2">
                {department.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="sticky top-0 bg-background border-b z-10">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {!department ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Department Assigned</h2>
                <p className="text-muted-foreground">
                  Please contact the administrator to assign you to a department.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Department</CardTitle>
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{department.name}</div>
                      <p className="text-xs text-muted-foreground">Code: {department.code}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{subjects.length}</div>
                      <p className="text-xs text-muted-foreground">In this department</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Policies</CardTitle>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{policies.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {policies.filter((p) => p.status === "published").length} published
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "subjects" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Department Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject Name</TableHead>
                          <TableHead>Code</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.code}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {activeTab === "policies" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Curriculum Policies</h2>
                    <Dialog open={isAddingPolicy} onOpenChange={setIsAddingPolicy}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Policy
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Curriculum Policy</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                              value={newPolicy.title}
                              onChange={(e) =>
                                setNewPolicy({ ...newPolicy, title: e.target.value })
                              }
                              placeholder="Policy title"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              value={newPolicy.description}
                              onChange={(e) =>
                                setNewPolicy({ ...newPolicy, description: e.target.value })
                              }
                              placeholder="Policy description and guidelines"
                              rows={4}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select
                              value={newPolicy.status}
                              onValueChange={(value) =>
                                setNewPolicy({ ...newPolicy, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleAddPolicy} className="w-full">
                            Create Policy
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {policies.map((policy) => (
                      <Card key={policy.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{policy.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Created: {new Date(policy.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={policy.status === "published" ? "default" : "secondary"}
                            >
                              {policy.status === "published" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {policy.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground mb-4">
                            {policy.description || "No description provided."}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {policy.status === "draft" && (
                              <Button
                                size="sm"
                                onClick={() => handlePublishPolicy(policy.id)}
                              >
                                Publish
                              </Button>
                            )}
                            {policy.policy_document_url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.open(policy.policy_document_url!, "_blank")
                                }
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Document
                              </Button>
                            ) : (
                              <label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={uploading}
                                  asChild
                                >
                                  <span>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploading ? "Uploading..." : "Upload Document"}
                                  </span>
                                </Button>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadDocument(policy.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {policies.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No curriculum policies yet. Create your first policy.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "syllabus" && department && (
                <SyllabusUpload 
                  departmentId={department.id} 
                  departmentName={department.name} 
                />
              )}

              {activeTab === "ratings" && department && (
                <TeacherRatings departmentId={department.id} />
              )}

              {activeTab === "teachers" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Department Teachers</CardTitle>
                  </CardHeader>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Teacher assignment feature coming soon.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HODDashboard;
