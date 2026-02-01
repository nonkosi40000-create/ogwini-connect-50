import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Mark {
  id: string;
  subject: string;
  assessment_name: string;
  assessment_type: string;
  marks_obtained: number;
  total_marks: number;
  term: string | null;
  feedback: string | null;
  created_at: string;
}

export function MarksWithFeedback() {
  const { user } = useAuth();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMarks();
    }
  }, [user]);

  const fetchMarks = async () => {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('learner_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMarks(data);
    }
    setLoading(false);
  };

  const getPercentage = (obtained: number, total: number) => Math.round((obtained / total) * 100);

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-primary">Distinction</Badge>;
    if (percentage >= 70) return <Badge className="bg-accent">Merit</Badge>;
    if (percentage >= 50) return <Badge variant="secondary">Pass</Badge>;
    return <Badge variant="destructive">Below 50%</Badge>;
  };

  // Group marks by subject
  const marksBySubject = marks.reduce((acc, mark) => {
    if (!acc[mark.subject]) acc[mark.subject] = [];
    acc[mark.subject].push(mark);
    return acc;
  }, {} as Record<string, Mark[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          My Results & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        {marks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No marks recorded yet</p>
            <p className="text-sm">Your results will appear here once teachers capture them.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {Object.entries(marksBySubject).map(([subject, subjectMarks]) => {
              const avgPercentage = Math.round(
                subjectMarks.reduce((sum, m) => sum + getPercentage(m.marks_obtained, m.total_marks), 0) / subjectMarks.length
              );

              return (
                <AccordionItem key={subject} value={subject} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">{subject}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${avgPercentage >= 50 ? 'text-primary' : 'text-destructive'}`}>
                          {avgPercentage}%
                        </span>
                        {avgPercentage >= 50 ? (
                          <TrendingUp className="w-4 h-4 text-primary" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {subjectMarks.map((mark) => {
                        const percentage = getPercentage(mark.marks_obtained, mark.total_marks);
                        return (
                          <div key={mark.id} className="p-3 rounded-lg bg-secondary/50">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{mark.assessment_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {mark.assessment_type} • {mark.term || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  {mark.marks_obtained}/{mark.total_marks}
                                </p>
                                {getGradeBadge(percentage)}
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                              <div
                                className={`h-full rounded-full ${percentage >= 50 ? 'bg-primary' : 'bg-destructive'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            {/* Teacher Feedback */}
                            {mark.feedback && (
                              <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/20">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-primary">Teacher Feedback</p>
                                    <p className="text-sm text-muted-foreground">{mark.feedback}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
