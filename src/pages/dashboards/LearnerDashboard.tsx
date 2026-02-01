import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, BookOpen, FileText, Calendar, Trophy, Bell, 
  Download, Clock, Play, ChevronRight, Star, Loader2, Send
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TeacherRatingForm } from "@/components/dashboard/TeacherRatingForm";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { MarksWithFeedback } from "@/components/dashboard/MarksWithFeedback";
import { SubmissionForm } from "@/components/dashboard/SubmissionForm";
import { PastPapers } from "@/components/PastPapers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LearningMaterial {
  id: string;
  title: string;
  subject: string | null;
  type: string;
  file_url: string;
  grade: string | null;
  description: string | null;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  grade: string;
  total_marks: number | null;
  duration_minutes: number | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type: string;
}

// Subjects for different grades
const grade8to9Subjects = [
  "IsiZulu", "English (FAL)", "Afrikaans (SAL)", "Mathematics", "Natural Sciences",
  "Life Orientation", "Dramatic Arts", "Music", "Visual Arts", "History",
  "Geography", "Technology", "Economics", "Accounting"
];

const grade10to12Compulsory = [
  "IsiZulu", "English (FAL)", "Life Orientation", "Mathematics"
];

export default function LearnerDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Subject modal
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  
  // Submission form
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "subjects", label: "My Subjects", icon: BookOpen },
    { id: "results", label: "Results", icon: Trophy },
    { id: "materials", label: "Learning Materials", icon: FileText },
    { id: "pastpapers", label: "Past Papers", icon: FileText },
    { id: "quizzes", label: "Quizzes", icon: Play },
    { id: "rate-teacher", label: "Rate Teachers", icon: Star },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const learnerGrade = profile?.grade || 'Grade 11';
  const isGrade10Plus = ["Grade 10", "Grade 11", "Grade 12"].includes(learnerGrade);
  
  // Get learner's subjects based on grade
  const mySubjects = isGrade10Plus ? grade10to12Compulsory : grade8to9Subjects;

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch learning materials
    const { data: materialsData } = await supabase
      .from('learning_materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (materialsData) setMaterials(materialsData);

    // Fetch published quizzes
    const { data: quizzesData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (quizzesData) setQuizzes(quizzesData);

    // Fetch announcements
    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (announcementsData) setAnnouncements(announcementsData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter materials by learner's grade and selected subject
  const filteredMaterials = materials.filter(m => 
    (!m.grade || m.grade === learnerGrade) &&
    (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSubjectMaterials = (subject: string) => {
    return materials.filter(m => 
      m.subject?.toLowerCase() === subject.toLowerCase() &&
      (!m.grade || m.grade === learnerGrade)
    );
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    setSubjectModalOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'Welcome, Learner'}
                </h1>
                <p className="text-muted-foreground">
                  {learnerGrade} {profile?.class || ''} • {profile?.id_number || 'Student'}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2">
                  <Star className="w-4 h-4" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
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
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Quick Stats & Actions */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{mySubjects.length}</p>
                            <p className="text-xs text-muted-foreground">My Subjects</p>
                          </div>
                        </div>
                      </div>
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{filteredMaterials.length}</p>
                            <p className="text-xs text-muted-foreground">Materials Available</p>
                          </div>
                        </div>
                      </div>
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Play className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{quizzes.length}</p>
                            <p className="text-xs text-muted-foreground">Quizzes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Subject Access */}
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-semibold text-foreground">My Subjects</h3>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("subjects")}>
                          View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {mySubjects.slice(0, 6).map((subject) => (
                          <button
                            key={subject}
                            onClick={() => handleSubjectClick(subject)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{subject}</span>
                              <p className="text-xs text-muted-foreground">
                                {getSubjectMaterials(subject).length} materials
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Materials */}
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-semibold text-foreground">Recent Materials</h3>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("materials")}>
                          View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {filteredMaterials.slice(0, 3).map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div>
                              <span className="text-sm font-medium text-foreground">{material.title}</span>
                              <p className="text-xs text-muted-foreground">{material.subject} • {material.type}</p>
                            </div>
                            <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        ))}
                        {filteredMaterials.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">No materials available yet</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notifications Sidebar */}
                  <div className="space-y-6">
                    <NotificationsPanel notifications={announcements} />
                    
                    {/* Quick Actions */}
                    <div className="glass-card p-6">
                      <h3 className="font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("rate-teacher")}>
                          <Star className="w-4 h-4 mr-2" /> Rate a Teacher
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("results")}>
                          <Trophy className="w-4 h-4 mr-2" /> View My Results
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("pastpapers")}>
                          <FileText className="w-4 h-4 mr-2" /> Past Papers
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subjects Tab */}
              {activeTab === "subjects" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">My Subjects</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mySubjects.map((subject) => (
                      <SubjectCard
                        key={subject}
                        name={subject}
                        materials={getSubjectMaterials(subject)}
                        onViewMaterials={() => handleSubjectClick(subject)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Results Tab */}
              {activeTab === "results" && (
                <div className="max-w-4xl mx-auto">
                  <MarksWithFeedback />
                </div>
              )}

              {/* Learning Materials Tab */}
              {activeTab === "materials" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground">Learning Materials</h2>
                    <Input 
                      placeholder="Search materials..." 
                      className="max-w-xs" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {filteredMaterials.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMaterials.map((material) => (
                        <div key={material.id} className="glass-card p-4 hover:border-primary/50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <h4 className="font-medium text-foreground text-sm mb-1">{material.title}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{material.subject} • {material.type}</p>
                          {material.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{material.description}</p>
                          )}
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Materials Found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Try a different search term' : 'Learning materials will appear here when uploaded by teachers.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Past Papers Tab */}
              {activeTab === "pastpapers" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Past Papers</h2>
                  <PastPapers />
                </div>
              )}

              {/* Quizzes Tab */}
              {activeTab === "quizzes" && (
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Available Quizzes</h2>
                  
                  {quizzes.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="glass-card p-6">
                          <h4 className="font-heading font-semibold text-foreground mb-2">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{quiz.subject} • {quiz.grade}</p>
                          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{quiz.duration_minutes || 30} minutes</span>
                            <span>•</span>
                            <Trophy className="w-4 h-4" />
                            <span>{quiz.total_marks || 100} marks</span>
                          </div>
                          <Button className="w-full">
                            <Play className="w-4 h-4 mr-2" /> Start Quiz
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Quizzes Available</h3>
                      <p className="text-muted-foreground">Quizzes will appear here when published by your teachers.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rate Teachers Tab */}
              {activeTab === "rate-teacher" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Rate Your Teachers</h2>
                  <p className="text-muted-foreground">
                    Your feedback helps improve teaching quality. All ratings are anonymous.
                  </p>
                  <div className="glass-card p-6">
                    <TeacherRatingForm />
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="max-w-3xl mx-auto">
                  <h2 className="font-heading text-xl font-semibold text-foreground mb-6">All Notifications</h2>
                  <NotificationsPanel notifications={announcements} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Subject Materials Modal */}
        <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {selectedSubject} - Materials
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedSubject && getSubjectMaterials(selectedSubject).length > 0 ? (
                getSubjectMaterials(selectedSubject).map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div>
                      <h4 className="font-medium text-foreground">{material.title}</h4>
                      <p className="text-sm text-muted-foreground">{material.type}</p>
                      {material.description && (
                        <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                      )}
                    </div>
                    <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No materials available for this subject yet.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Submission Form */}
        <SubmissionForm
          isOpen={submissionOpen}
          onClose={() => setSubmissionOpen(false)}
          assignment={selectedAssignment}
          userId={user?.id || ""}
        />
      </div>
    </Layout>
  );
}
