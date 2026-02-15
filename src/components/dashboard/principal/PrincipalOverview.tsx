import { Users, School, TrendingUp, TrendingDown, AlertTriangle, BarChart3, GraduationCap } from "lucide-react";

interface PrincipalOverviewProps {
  learnerCount: number;
  teacherCount: number;
  gradeHeadCount: number;
  pendingComplaints: number;
  gradePerformance: {
    grade: string;
    students: number;
    average: number;
    passRate: number;
    trend: string;
  }[];
}

export function PrincipalOverview({
  learnerCount, teacherCount, gradeHeadCount, pendingComplaints, gradePerformance
}: PrincipalOverviewProps) {
  const overallPassRate = gradePerformance.length > 0
    ? Math.round(gradePerformance.reduce((sum, g) => sum + g.passRate, 0) / gradePerformance.length)
    : 0;
  const overallAverage = gradePerformance.length > 0
    ? Math.round(gradePerformance.reduce((sum, g) => sum + g.average, 0) / gradePerformance.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Learners</p>
              <p className="text-3xl font-bold text-foreground">{learnerCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Teaching Staff</p>
              <p className="text-3xl font-bold text-foreground">{teacherCount + gradeHeadCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <School className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">School Average</p>
              <p className="text-3xl font-bold text-foreground">{overallAverage}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Complaints</p>
              <p className="text-3xl font-bold text-destructive">{pendingComplaints}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Grade Performance & Pass Rate Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Grade Pass Rates
          </h3>
          <div className="space-y-4">
            {gradePerformance.map((grade) => (
              <div key={grade.grade} className="flex items-center gap-4">
                <span className="w-20 font-medium text-foreground text-sm">{grade.grade}</span>
                <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${grade.passRate >= 85 ? "bg-primary" : grade.passRate >= 70 ? "bg-accent" : "bg-destructive"}`}
                    style={{ width: `${grade.passRate}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-foreground">{grade.passRate}%</span>
                {grade.trend === "up"
                  ? <TrendingUp className="w-4 h-4 text-primary" />
                  : <TrendingDown className="w-4 h-4 text-destructive" />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Performance Snapshot
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-3xl font-bold text-primary">{overallPassRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Pass Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center">
              <p className="text-3xl font-bold text-accent-foreground">{overallAverage}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Average</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{learnerCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Enrolled Learners</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{gradePerformance.filter(g => g.trend === "up").length}/{gradePerformance.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Grades Improving</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
