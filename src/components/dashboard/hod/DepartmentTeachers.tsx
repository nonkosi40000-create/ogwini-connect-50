import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Star, FileText, Loader2 } from "lucide-react";

interface TeacherInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  materials_count: number;
  avg_rating: number;
  rating_count: number;
}

interface DepartmentTeachersProps {
  departmentId: string;
  subjectNames: string[];
}

export function DepartmentTeachers({ departmentId, subjectNames }: DepartmentTeachersProps) {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, [departmentId]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Get teachers assigned to this department
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, department_id")
        .eq("department_id", departmentId);

      if (!profiles || profiles.length === 0) {
        // Fallback: get all teachers and check roles
        setTeachers([]);
        setLoading(false);
        return;
      }

      // Filter to only those with teacher/hod roles
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds)
        .in("role", ["teacher", "hod"]);

      const teacherUserIds = new Set(roles?.map((r) => r.user_id) || []);
      const teacherProfiles = profiles.filter((p) => teacherUserIds.has(p.user_id));

      if (teacherProfiles.length === 0) {
        setTeachers([]);
        setLoading(false);
        return;
      }

      const tIds = teacherProfiles.map((t) => t.user_id);

      // Get material counts per teacher
      const { data: materials } = await supabase
        .from("learning_materials")
        .select("uploaded_by")
        .in("uploaded_by", tIds);

      const materialCounts: Record<string, number> = {};
      materials?.forEach((m) => {
        if (m.uploaded_by) materialCounts[m.uploaded_by] = (materialCounts[m.uploaded_by] || 0) + 1;
      });

      // Get ratings for department subjects
      let ratingMap: Record<string, { total: number; count: number }> = {};
      if (subjectNames.length > 0) {
        const { data: ratings } = await supabase
          .from("teacher_ratings")
          .select("teacher_id, rating")
          .in("teacher_id", tIds)
          .in("subject", subjectNames);

        ratings?.forEach((r) => {
          if (!ratingMap[r.teacher_id]) ratingMap[r.teacher_id] = { total: 0, count: 0 };
          ratingMap[r.teacher_id].total += r.rating;
          ratingMap[r.teacher_id].count += 1;
        });
      }

      const result: TeacherInfo[] = teacherProfiles.map((p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        materials_count: materialCounts[p.user_id] || 0,
        avg_rating: ratingMap[p.user_id] ? ratingMap[p.user_id].total / ratingMap[p.user_id].count : 0,
        rating_count: ratingMap[p.user_id]?.count || 0,
      }));

      setTeachers(result.sort((a, b) => b.avg_rating - a.avg_rating));
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
      ))}
      {rating > 0 && <span className="ml-1.5 text-sm font-medium">{rating.toFixed(1)}</span>}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Department Teachers</h2>
        <p className="text-sm text-muted-foreground">Staff members assigned to your department with performance metrics</p>
      </div>

      {teachers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Materials Uploaded</TableHead>
                  <TableHead>Student Rating</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => (
                  <TableRow key={t.user_id}>
                    <TableCell className="font-medium">{t.first_name} {t.last_name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {t.materials_count}
                      </div>
                    </TableCell>
                    <TableCell>{t.avg_rating > 0 ? renderStars(t.avg_rating) : <span className="text-muted-foreground text-sm">No ratings</span>}</TableCell>
                    <TableCell>{t.rating_count > 0 ? `${t.rating_count} reviews` : "-"}</TableCell>
                    <TableCell>
                      {t.avg_rating >= 4 ? (
                        <Badge variant="default">Excellent</Badge>
                      ) : t.avg_rating >= 3 ? (
                        <Badge variant="secondary">Good</Badge>
                      ) : t.avg_rating > 0 ? (
                        <Badge variant="destructive">Needs Improvement</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
            <p className="text-muted-foreground">No teachers are currently assigned to this department.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
