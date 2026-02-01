import { BookOpen, Download, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectMaterial {
  id: string;
  title: string;
  type: string;
  file_url: string;
}

interface SubjectCardProps {
  name: string;
  materials: SubjectMaterial[];
  onViewMaterials?: () => void;
}

export function SubjectCard({ name, materials, onViewMaterials }: SubjectCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-all cursor-pointer" onClick={onViewMaterials}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {materials.length} materials available
        </p>
        {materials.length > 0 && (
          <div className="space-y-2">
            {materials.slice(0, 2).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/50">
                <span className="truncate flex-1">{m.title}</span>
                <a href={m.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            ))}
            {materials.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">+{materials.length - 2} more</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
