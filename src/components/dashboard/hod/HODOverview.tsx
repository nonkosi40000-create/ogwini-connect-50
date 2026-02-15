import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2, BookOpen, FileText, Users, BarChart3, TrendingUp, AlertTriangle, GraduationCap,
} from "lucide-react";

interface HODOverviewProps {
  department: { id: string; name: string; code: string };
  subjects: { id: string; name: string; code: string }[];
  policies: { id: string; status: string }[];
  teacherCount: number;
  materialCount: number;
  syllabiCount: number;
  avgPerformance: number;
  atRiskCount: number;
  totalLearners: number;
}

export function HODOverview({
  department, subjects, policies, teacherCount, materialCount,
  syllabiCount, avgPerformance, atRiskCount, totalLearners,
}: HODOverviewProps) {
  const publishedPolicies = policies.filter((p) => p.status === "published").length;

  const stats = [
    { label: "Department", value: department.name, sub: `Code: ${department.code}`, icon: Building2, color: "text-primary" },
    { label: "Subjects", value: subjects.length, sub: "In department", icon: BookOpen, color: "text-blue-500" },
    { label: "Teachers", value: teacherCount, sub: "Assigned staff", icon: Users, color: "text-emerald-500" },
    { label: "Learning Materials", value: materialCount, sub: "Uploaded resources", icon: FileText, color: "text-violet-500" },
    { label: "Syllabi Uploaded", value: syllabiCount, sub: "Curriculum documents", icon: GraduationCap, color: "text-amber-500" },
    { label: "Curriculum Policies", value: policies.length, sub: `${publishedPolicies} published`, icon: FileText, color: "text-rose-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance & At-Risk Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Average Subject Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold">{avgPerformance > 0 ? `${avgPerformance.toFixed(1)}%` : "N/A"}</span>
              {avgPerformance >= 60 && <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />}
              {avgPerformance > 0 && avgPerformance < 60 && <AlertTriangle className="w-5 h-5 text-amber-500 mb-1" />}
            </div>
            {avgPerformance > 0 && (
              <Progress value={avgPerformance} className="h-2" />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Across all subjects in {department.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-base">At-Risk Learners</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold">{atRiskCount}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {totalLearners} learners</span>
            </div>
            {totalLearners > 0 && (
              <Progress value={totalLearners > 0 ? ((totalLearners - atRiskCount) / totalLearners) * 100 : 0} className="h-2" />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Students averaging below 50% in department subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-sm py-1 px-3">
                <BookOpen className="w-3 h-3 mr-1.5" />
                {s.name} ({s.code})
              </Badge>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">No subjects assigned to this department yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
