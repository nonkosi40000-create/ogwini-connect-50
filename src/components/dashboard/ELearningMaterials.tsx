import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, Download, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type MaterialType = "all" | "E-Book" | "Past Paper" | "Article";

interface LibraryMaterial {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  grade: string | null;
  file_url: string;
  description: string | null;
}

export function ELearningMaterials() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<MaterialType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const learnerGrade = profile?.grade || "Grade 11";

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("library_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setMaterials(data);
      setLoading(false);
    };
    fetchMaterials();
  }, []);

  const filtered = materials.filter((m) => {
    const matchesType = activeType === "all" || m.type === activeType;
    const matchesGrade = !m.grade || m.grade === learnerGrade;
    const matchesSearch = !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesGrade && matchesSearch;
  });

  const types: { label: string; value: MaterialType }[] = [
    { label: "All", value: "all" },
    { label: "E-Books", value: "E-Book" },
    { label: "Past Papers", value: "Past Paper" },
    { label: "Articles", value: "Article" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeType === t.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Input
        placeholder="Search materials..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-xs"
      />

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Materials Found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term." : "Materials will appear here when uploaded by the librarian."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="glass-card p-4 hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                {m.type === "E-Book" ? <BookOpen className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
              </div>
              <h4 className="font-medium text-foreground text-sm mb-1">{m.title}</h4>
              <p className="text-xs text-muted-foreground mb-1">{m.type} • {m.subject || "General"}</p>
              {m.grade && <p className="text-xs text-muted-foreground mb-2">{m.grade}</p>}
              {m.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>}
              <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
