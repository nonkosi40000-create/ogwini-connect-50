import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader2, Filter, BookOpen } from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  grade: string | null;
  file_url: string;
  created_at: string;
  uploaded_by: string | null;
  uploader_name?: string;
}

interface DepartmentResourcesProps {
  subjectNames: string[];
}

export function DepartmentResources({ subjectNames }: DepartmentResourcesProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchMaterials();
  }, [subjectNames]);

  const fetchMaterials = async () => {
    if (subjectNames.length === 0) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("learning_materials")
        .select("*")
        .in("subject", subjectNames)
        .order("created_at", { ascending: false });

      if (!data) { setMaterials([]); setLoading(false); return; }

      // Get uploader names
      const uploaderIds = [...new Set(data.filter((m) => m.uploaded_by).map((m) => m.uploaded_by!))];
      let uploaderMap: Record<string, string> = {};
      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", uploaderIds);
        profiles?.forEach((p) => {
          uploaderMap[p.user_id] = `${p.first_name} ${p.last_name}`;
        });
      }

      setMaterials(data.map((m) => ({
        ...m,
        uploader_name: m.uploaded_by ? uploaderMap[m.uploaded_by] || "Unknown" : "Unknown",
      })));
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter((m) => {
    if (filterSubject !== "all" && m.subject !== filterSubject) return false;
    if (filterType !== "all" && m.type !== filterType) return false;
    return true;
  });

  const types = [...new Set(materials.map((m) => m.type))];

  const getTypeBadge = (type: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      homework: "default",
      notes: "secondary",
      worksheet: "outline",
    };
    return <Badge variant={map[type] || "secondary"}>{type}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Learning Resources</h2>
        <p className="text-sm text-muted-foreground">Materials uploaded by department teachers across all subjects</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterSubject} onValueChange={setFilterSubject}>
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} resources</span>
      </div>

      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>{m.subject || "-"}</TableCell>
                    <TableCell>{getTypeBadge(m.type)}</TableCell>
                    <TableCell>{m.grade || "All"}</TableCell>
                    <TableCell>{m.uploader_name}</TableCell>
                    <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => window.open(m.file_url, "_blank")}>
                        <Download className="w-4 h-4" />
                      </Button>
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
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
            <p className="text-muted-foreground">No learning materials match the current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
