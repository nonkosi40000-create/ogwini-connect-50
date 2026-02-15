import { TrendingUp, TrendingDown, Users, Award, AlertTriangle } from "lucide-react";

interface GradeData {
  grade: string;
  students: number;
  average: number;
  passRate: number;
  trend: string;
}

interface AcademicPerformanceProps {
  gradePerformance: GradeData[];
}

export function AcademicPerformance({ gradePerformance }: AcademicPerformanceProps) {
  const atRiskGrades = gradePerformance.filter(g => g.passRate < 75);
  const topPerformers = [...gradePerformance].sort((a, b) => b.passRate - a.passRate);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Academic Performance Analytics</h2>

      {/* At-Risk Alert */}
      {atRiskGrades.length > 0 && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Attention Required</p>
            <p className="text-sm text-muted-foreground">
              {atRiskGrades.map(g => g.grade).join(", ")} {atRiskGrades.length === 1 ? "has" : "have"} a pass rate below 75%. Consider intervention strategies.
            </p>
          </div>
        </div>
      )}

      {/* Detailed Grade Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gradePerformance.map((grade, index) => (
          <div key={grade.grade} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold text-foreground">{grade.grade}</h3>
              {grade.trend === "up"
                ? <span className="flex items-center gap-1 text-primary text-sm font-medium"><TrendingUp className="w-4 h-4" /> Improving</span>
                : <span className="flex items-center gap-1 text-destructive text-sm font-medium"><TrendingDown className="w-4 h-4" /> Declining</span>}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{grade.students || 0}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{grade.average}%</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${grade.passRate >= 85 ? "text-primary" : grade.passRate >= 70 ? "text-accent-foreground" : "text-destructive"}`}>
                  {grade.passRate}%
                </p>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${grade.passRate >= 85 ? "bg-primary" : grade.passRate >= 70 ? "bg-accent" : "bg-destructive"}`}
                  style={{ width: `${grade.passRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Longitudinal Summary */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" /> Performance Rankings
        </h3>
        <div className="space-y-3">
          {topPerformers.map((g, i) => (
            <div key={g.grade} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-muted text-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i + 1}
              </span>
              <span className="font-medium text-foreground flex-1">{g.grade}</span>
              <span className="text-sm text-muted-foreground">{g.students} students</span>
              <span className="font-semibold text-foreground">{g.passRate}% pass rate</span>
              <span className="text-sm text-muted-foreground">{g.average}% avg</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
