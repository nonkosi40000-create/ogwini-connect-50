import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Loader2, Users, BarChart3, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Registration {
  id: string;
  role: string;
  status: string;
  grade: string | null;
}

interface GovernanceReportsProps {
  registrations: Registration[];
  gradePerformance: {
    grade: string;
    students: number;
    average: number;
    passRate: number;
    trend: string;
  }[];
}

export function GovernanceReports({ registrations, gradePerformance }: GovernanceReportsProps) {
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState({ total: 0, resolved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [deptsRes, meetingsRes, complaintsRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('meetings').select('id', { count: 'exact' }),
        supabase.from('complaints').select('status'),
      ]);
      if (deptsRes.data) setDepartments(deptsRes.data);
      setMeetingsCount(meetingsRes.count || 0);
      if (complaintsRes.data) {
        setComplaintsCount({
          total: complaintsRes.data.length,
          resolved: complaintsRes.data.filter(c => c.status === 'resolved').length,
          pending: complaintsRes.data.filter(c => c.status === 'pending').length,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const learnerCount = registrations.filter(r => r.role === 'learner').length;
  const teacherCount = registrations.filter(r => r.role === 'teacher').length;
  const totalStaff = registrations.filter(r => r.role !== 'learner').length;
  const overallPassRate = gradePerformance.length > 0
    ? Math.round(gradePerformance.reduce((s, g) => s + g.passRate, 0) / gradePerformance.length) : 0;
  const overallAverage = gradePerformance.length > 0
    ? Math.round(gradePerformance.reduce((s, g) => s + g.average, 0) / gradePerformance.length) : 0;

  const generateReport = () => {
    const now = new Date();
    const reportContent = `
OGWINI COMPREHENSIVE TECHNICAL HIGH SCHOOL
GOVERNANCE REPORT
Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
${"=".repeat(60)}

1. ENROLMENT SUMMARY
   Total Learners: ${learnerCount}
   Total Staff: ${totalStaff} (Teachers: ${teacherCount})
   Departments: ${departments.length}

2. ACADEMIC PERFORMANCE
   Overall Pass Rate: ${overallPassRate}%
   Overall Average: ${overallAverage}%
   
   Grade Breakdown:
${gradePerformance.map(g => `   - ${g.grade}: ${g.passRate}% pass rate, ${g.average}% average (${g.trend === 'up' ? '↑ Improving' : '↓ Declining'})`).join('\n')}

3. COMPLAINTS & DISCIPLINE
   Total Complaints: ${complaintsCount.total}
   Resolved: ${complaintsCount.resolved}
   Pending: ${complaintsCount.pending}
   Resolution Rate: ${complaintsCount.total > 0 ? Math.round((complaintsCount.resolved / complaintsCount.total) * 100) : 0}%

4. GOVERNANCE MEETINGS
   Total Meetings Recorded: ${meetingsCount}

5. DEPARTMENT STRUCTURE
${departments.map(d => `   - ${d.name} (${d.code})`).join('\n')}

${"=".repeat(60)}
End of Report
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Governance_Report_${now.toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">Governance Reports</h2>
        <Button onClick={generateReport}>
          <Download className="w-4 h-4 mr-2" /> Download Report
        </Button>
      </div>

      {/* Report Preview */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Report Summary
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{learnerCount}</p>
            <p className="text-xs text-muted-foreground">Enrolled Learners</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalStaff}</p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{overallPassRate}%</p>
            <p className="text-xs text-muted-foreground">Pass Rate</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{meetingsCount}</p>
            <p className="text-xs text-muted-foreground">Meetings Held</p>
          </div>
        </div>

        {/* Complaints Summary */}
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <h4 className="font-medium text-foreground mb-3">Complaints & Resolution</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-foreground">{complaintsCount.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{complaintsCount.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div>
              <p className="text-xl font-bold text-destructive">{complaintsCount.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          {complaintsCount.total > 0 && (
            <div className="mt-3">
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(complaintsCount.resolved / complaintsCount.total) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round((complaintsCount.resolved / complaintsCount.total) * 100)}% resolution rate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
