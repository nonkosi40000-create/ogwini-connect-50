import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, BookOpen, User } from "lucide-react";

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

interface DepartmentHead {
  id: string;
  user_id: string;
  department_id: string;
}

const SchoolOrganogram = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departmentHeads, setDepartmentHeads] = useState<DepartmentHead[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, subjectRes, headsRes] = await Promise.all([
        supabase.from("departments").select("*").order("name"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("department_heads").select("*"),
      ]);

      if (deptRes.data) setDepartments(deptRes.data);
      if (subjectRes.data) setSubjects(subjectRes.data);
      if (headsRes.data) setDepartmentHeads(headsRes.data);
    } catch (error) {
      console.error("Error fetching organogram data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectsForDepartment = (departmentId: string) => {
    return subjects.filter((s) => s.department_id === departmentId);
  };

  const hasHOD = (departmentId: string) => {
    return departmentHeads.some((h) => h.department_id === departmentId);
  };

  const getDepartmentColor = (code: string) => {
    switch (code) {
      case "SCI":
        return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
      case "COM":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
      case "TECH":
        return "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300";
      case "ARTS":
        return "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300";
      case "LANG":
        return "bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-300";
      case "GEN":
        return "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300";
      default:
        return "bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* School Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Ogwini Comprehensive Technical High School</h2>
        <p className="text-muted-foreground">Academic Structure & Departments</p>
      </div>

      {/* Principal Level */}
      <div className="flex justify-center">
        <Card className="w-64 border-2 border-primary">
          <CardContent className="py-4 text-center">
            <User className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">Principal</p>
            <p className="text-sm text-muted-foreground">School Leadership</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Line */}
      <div className="flex justify-center">
        <div className="w-0.5 h-8 bg-border" />
      </div>

      {/* Deputy Principal Level */}
      <div className="flex justify-center">
        <Card className="w-64 border-2 border-secondary">
          <CardContent className="py-4 text-center">
            <User className="w-8 h-8 mx-auto mb-2 text-secondary-foreground" />
            <p className="font-semibold">Deputy Principal</p>
            <p className="text-sm text-muted-foreground">Academic Affairs</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Lines to Departments */}
      <div className="flex justify-center">
        <div className="w-0.5 h-8 bg-border" />
      </div>
      <div className="flex justify-center px-4">
        <div className="w-full max-w-4xl h-0.5 bg-border" />
      </div>

      {/* Departments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departments.map((dept) => (
          <Card key={dept.id} className={`border-2 ${getDepartmentColor(dept.code)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{dept.name}</CardTitle>
                {hasHOD(dept.id) && (
                  <Badge variant="outline" className="text-xs">
                    {dept.code === "LANG" ? "LLC Assigned" : "HOD Assigned"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{dept.code === "LANG" ? "Language Learning Coordinator" : "Head of Department"}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  <span>Subjects ({getSubjectsForDepartment(dept.id).length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {getSubjectsForDepartment(dept.id).map((subject) => (
                    <Badge key={subject.id} variant="secondary" className="text-xs">
                      {subject.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subjects Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Subjects by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept) => (
              <div key={dept.id}>
                <h4 className="font-semibold mb-2 text-sm">{dept.name}</h4>
                <ul className="space-y-1">
                  {getSubjectsForDepartment(dept.id).map((subject) => (
                    <li key={subject.id} className="text-sm text-muted-foreground">
                      • {subject.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolOrganogram;
