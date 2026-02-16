import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, User, Loader2, Search, GraduationCap, ChevronDown, ChevronUp, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  user_id: string | null;
}

interface StaffManagementProps {
  registrations: Registration[];
  onRefresh?: () => void;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export function StaffManagement({ registrations, onRefresh }: StaffManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const learnerCount = registrations.filter(r => r.role === 'learner').length;
  const teacherCount = registrations.filter(r => r.role === 'teacher').length;
  const gradeHeadCount = registrations.filter(r => r.role === 'grade_head').length;
  const hodCount = registrations.filter(r => r.role === 'hod').length;
  const adminCount = registrations.filter(r => r.role === 'admin').length;
  const totalStaff = registrations.filter(r => r.role !== 'learner').length;

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
      setLoading(false);
    };
    fetchDepartments();
  }, []);

  const staffRegistrations = registrations.filter(r => r.role !== 'learner');

  const filteredStaff = staffRegistrations.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const getHodForDepartment = (deptId: string) => {
    const hod = registrations.find(r => r.role === 'hod' && r.department_id === deptId);
    return hod ? `${hod.first_name} ${hod.last_name}` : "Unassigned";
  };

  const getDeptMembers = (deptId: string) => {
    return registrations.filter(r => r.department_id === deptId && r.role !== 'learner');
  };

  const getUnassignedStaff = () => {
    return staffRegistrations.filter(r => !r.department_id);
  };

  const handleReassign = async (registration: Registration) => {
    if (!selectedDept) {
      toast.error("Please select a department");
      return;
    }
    setSaving(true);
    try {
      // Update registration
      const { error: regError } = await supabase
        .from('registrations')
        .update({ department_id: selectedDept })
        .eq('id', registration.id);

      if (regError) throw regError;

      // Also update profile if user_id exists
      if (registration.user_id) {
        await supabase
          .from('profiles')
          .update({ department_id: selectedDept })
          .eq('user_id', registration.user_id);
      }

      toast.success(`${registration.first_name} ${registration.last_name} reassigned successfully`);
      setReassigning(null);
      setSelectedDept("");
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to reassign");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unassignedStaff = getUnassignedStaff();

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Staff Management</h2>

      {/* Role Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-5 text-center">
          <GraduationCap className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-3xl font-bold text-foreground">{learnerCount}</p>
          <p className="text-sm text-muted-foreground">Learners</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">{totalStaff}</p>
          <p className="text-sm text-muted-foreground">Total Staff</p>
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
        <div className="space-y-3">
          {departments.map((dept) => {
            const deptMembers = getDeptMembers(dept.id);
            const isExpanded = expandedDept === dept.id;
            return (
              <div key={dept.id} className="rounded-xl bg-secondary/50 border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-foreground">{dept.name}</h4>
                    <Badge variant="outline">{dept.code}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      HOD: {getHodForDepartment(dept.id)}
                    </span>
                    <Badge variant="secondary">{deptMembers.length} staff</Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-2">
                    {deptMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">No staff assigned to this department</p>
                    ) : (
                      deptMembers.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{m.first_name} {m.last_name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs capitalize">{m.role.replace('_', ' ')}</Badge>
                          {reassigning === m.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={selectedDept} onValueChange={setSelectedDept}>
                                <SelectTrigger className="w-48 h-8 text-xs">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="default" onClick={() => handleReassign(m)} disabled={saving} className="h-8 text-xs">
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setReassigning(null); setSelectedDept(""); }} className="h-8 text-xs">
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => { setReassigning(m.id); setSelectedDept(m.department_id || ""); }} className="h-8 text-xs gap-1">
                              <ArrowRightLeft className="w-3 h-3" /> Reassign
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned Staff */}
          {unassignedStaff.length > 0 && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 overflow-hidden">
              <button
                onClick={() => setExpandedDept(expandedDept === 'unassigned' ? null : 'unassigned')}
                className="w-full p-4 flex items-center justify-between hover:bg-destructive/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-destructive">Unassigned Staff</h4>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">{unassignedStaff.length} staff</Badge>
                  {expandedDept === 'unassigned' ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedDept === 'unassigned' && (
                <div className="border-t border-destructive/20 p-4 space-y-2">
                  {unassignedStaff.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{m.first_name} {m.last_name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">{m.role.replace('_', ' ')}</Badge>
                      {reassigning === m.id ? (
                        <div className="flex items-center gap-2">
                          <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="default" onClick={() => handleReassign(m)} disabled={saving} className="h-8 text-xs">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReassigning(null); setSelectedDept(""); }} className="h-8 text-xs">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setReassigning(m.id); setSelectedDept(""); }} className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                          <ArrowRightLeft className="w-3 h-3" /> Assign
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Staff Directory */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Staff Directory ({staffRegistrations.length} total)
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
                {dept ? (
                  <Badge variant="outline" className="text-xs">{dept.name}</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">No Department</Badge>
                )}
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
