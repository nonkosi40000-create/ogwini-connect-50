import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Loader2, AlertTriangle, Users } from "lucide-react";

interface SubjectPerformance {
  subject: string;
  average: number;
  totalStudents: number;
  atRisk: number;
  highest: number;
  lowest: number;
}

interface AtRiskLearner {
  learner_id: string;
  name: string;
  subject: string;
  average: number;
}

interface PerformanceReportsProps {
  subjectNames: string[];
  onAtRiskUpdate?: (count: number, total: number) => void;
  onAvgUpdate?: (avg: number) => void;
}

export function PerformanceReports({ subjectNames, onAtRiskUpdate, onAvgUpdate }: PerformanceReportsProps) {
  const [subjectPerf, setSubjectPerf] = useState<SubjectPerformance[]>([]);
  const [atRiskLearners, setAtRiskLearners] = useState<AtRiskLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("all");

  useEffect(() => {
    fetchPerformance();
  }, [subjectNames]);

  const fetchPerformance = async () => {
    if (subjectNames.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: marks } = await supabase
        .from("marks")
        .select("learner_id, subject, marks_obtained, total_marks")
        .in("subject", subjectNames);

      if (!marks || marks.length === 0) { setLoading(false); return; }

      // Aggregate by subject
      const bySubject: Record<string, { scores: number[]; learners: Record<string, number[]> }> = {};
      marks.forEach((m) => {
        if (!bySubject[m.subject]) bySubject[m.subject] = { scores: [], learners: {} };
        const pct = (Number(m.marks_obtained) / Number(m.total_marks)) * 100;
        bySubject[m.subject].scores.push(pct);
        if (!bySubject[m.subject].learners[m.learner_id]) bySubject[m.subject].learners[m.learner_id] = [];
        bySubject[m.subject].learners[m.learner_id].push(pct);
      });

      const perfData: SubjectPerformance[] = [];
      const atRisk: AtRiskLearner[] = [];
      const allLearnerIds = new Set<string>();

      Object.entries(bySubject).forEach(([subject, data]) => {
        const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const learnerCount = Object.keys(data.learners).length;
        let riskCount = 0;

        Object.entries(data.learners).forEach(([learnerId, scores]) => {
          allLearnerIds.add(learnerId);
          const learnerAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (learnerAvg < 50) {
            riskCount++;
            atRisk.push({ learner_id: learnerId, name: "", subject, average: learnerAvg });
          }
        });

        perfData.push({
          subject,
          average: avg,
          totalStudents: learnerCount,
          atRisk: riskCount,
          highest: Math.max(...data.scores),
          lowest: Math.min(...data.scores),
        });
      });

      // Get learner names for at-risk
      if (atRisk.length > 0) {
        const riskIds = [...new Set(atRisk.map((r) => r.learner_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", riskIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach((p) => { nameMap[p.user_id] = `${p.first_name} ${p.last_name}`; });
        atRisk.forEach((r) => { r.name = nameMap[r.learner_id] || "Unknown"; });
      }

      setSubjectPerf(perfData.sort((a, b) => b.average - a.average));
      setAtRiskLearners(atRisk.sort((a, b) => a.average - b.average));

      // Report totals up
      const overallAvg = perfData.length > 0 ? perfData.reduce((s, p) => s + p.average, 0) / perfData.length : 0;
      onAvgUpdate?.(overallAvg);
      onAtRiskUpdate?.(atRisk.length, allLearnerIds.size);
    } catch (error) {
      console.error("Error fetching performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAtRisk = selectedSubject === "all"
    ? atRiskLearners
    : atRiskLearners.filter((r) => r.subject === selectedSubject);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Performance Reports</h2>
        <p className="text-sm text-muted-foreground">Student performance analytics across department subjects</p>
      </div>

      {/* Subject Performance Cards */}
      {subjectPerf.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectPerf.map((sp) => (
              <Card key={sp.subject}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{sp.subject}</CardTitle>
                    {sp.average >= 60 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Average</span>
                        <span className="font-semibold">{sp.average.toFixed(1)}%</span>
                      </div>
                      <Progress value={sp.average} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Students:</span> <strong>{sp.totalStudents}</strong></div>
                      <div><span className="text-muted-foreground">At Risk:</span> <strong className={sp.atRisk > 0 ? "text-destructive" : ""}>{sp.atRisk}</strong></div>
                      <div><span className="text-muted-foreground">Highest:</span> <strong>{sp.highest.toFixed(0)}%</strong></div>
                      <div><span className="text-muted-foreground">Lowest:</span> <strong>{sp.lowest.toFixed(0)}%</strong></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* At-Risk Learners Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <CardTitle className="text-base">At-Risk Learners (Below 50%)</CardTitle>
                </div>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectNames.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAtRisk.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAtRisk.map((r, i) => (
                      <TableRow key={`${r.learner_id}-${r.subject}-${i}`}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-destructive">{r.average.toFixed(1)}%</span>
                            <Progress value={r.average} className="h-1.5 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.average < 30 ? (
                            <Badge variant="destructive">Critical</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">At Risk</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-6">No at-risk learners found. Great job!</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
            <p className="text-muted-foreground">Marks data will appear here once teachers record assessments.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
