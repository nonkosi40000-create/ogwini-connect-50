import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, User, Loader2, Search, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Registration {
  id: string;
  role: string;
  status: string;
  grade: string | null;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | null;
  phone: string | null;
}

interface StaffManagementProps {
  registrations: Registration[];
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export function StaffManagement({ registrations }: StaffManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const learnerCount = registrations.filter(r => r.role === 'learner').length;
  const teacherCount = registrations.filter(r => r.role === 'teacher').length;
  const gradeHeadCount = registrations.filter(r => r.role === 'grade_head').length;
  const hodCount = registrations.filter(r => r.role === 'hod').length;
  const adminCount = registrations.filter(r => r.role === 'admin').length;

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
      setLoading(false);
    };
    fetchDepartments();
  }, []);

  // Staff = non-learner registrations
  const staffRegistrations = registrations.filter(r => r.role !== 'learner');

  const filteredStaff = staffRegistrations.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // Get HOD for a department from registrations (person registered as hod with that department_id)
  const getHodForDepartment = (deptId: string) => {
    const hod = registrations.find(r => r.role === 'hod' && r.department_id === deptId);
    return hod ? `${hod.first_name} ${hod.last_name}` : "Unassigned";
  };

  // Get members of a department from registrations (anyone with that department_id)
  const getDeptMembers = (deptId: string) => {
    return registrations.filter(r => r.department_id === deptId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Staff Management</h2>

      {/* Role Summary */}
      <div className="grid sm:grid-cols-5 gap-4">
        <div className="glass-card p-5 text-center">
          <GraduationCap className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-3xl font-bold text-foreground">{learnerCount}</p>
          <p className="text-sm text-muted-foreground">Learners</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{teacherCount}</p>
          <p className="text-sm text-muted-foreground">Teachers</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{gradeHeadCount}</p>
          <p className="text-sm text-muted-foreground">Grade Heads</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{hodCount}</p>
          <p className="text-sm text-muted-foreground">HODs</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{adminCount}</p>
          <p className="text-sm text-muted-foreground">Administrators</p>
        </div>
      </div>

      {/* Department Structure */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Department Structure
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptMembers = getDeptMembers(dept.id);
            const deptStaff = deptMembers.filter(m => m.role !== 'learner');
            const deptLearners = deptMembers.filter(m => m.role === 'learner');
            return (
              <div key={dept.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{dept.name}</h4>
                  <Badge variant="outline">{dept.code}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  HOD: {getHodForDepartment(dept.id)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {deptStaff.length} staff member{deptStaff.length !== 1 ? "s" : ""}
                </p>
                {deptLearners.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {deptLearners.length} learner{deptLearners.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Directory */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Staff Directory
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredStaff.map((s) => {
            const dept = departments.find(d => d.id === s.department_id);
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs capitalize">{s.role.replace('_', ' ')}</Badge>
                {dept && <Badge variant="outline" className="text-xs">{dept.name}</Badge>}
              </div>
            );
          })}
          {filteredStaff.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No staff found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
