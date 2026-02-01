import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Send, Loader2, CheckCircle } from "lucide-react";

interface SubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    title: string;
    subject: string;
    due_date: string;
  } | null;
  userId: string;
}

export function SubmissionForm({ isOpen, onClose, assignment, userId }: SubmissionFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!assignment || !file) {
      toast({
        title: "Missing File",
        description: "Please upload your assignment file.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`submissions/${userId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(`submissions/${userId}/${fileName}`);

      // Note: In a full implementation, you would save to a submissions table
      toast({
        title: "Assignment Submitted",
        description: `Your submission for "${assignment.title}" has been received.`,
      });

      setFile(null);
      setNotes("");
      onClose();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit assignment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Submit Assignment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-3 rounded-lg bg-secondary/50">
            <h4 className="font-medium text-foreground">{assignment.title}</h4>
            <p className="text-sm text-muted-foreground">{assignment.subject}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          </div>

          <div>
            <Label>Upload Your Work *</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                type="file"
                id="submission-file"
                className="hidden"
                accept=".pdf,.doc,.docx,.zip,.rar"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="submission-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Click to upload your assignment</p>
                    <p className="text-xs mt-1">PDF, DOC, DOCX, ZIP (max 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for your teacher..."
              rows={3}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={submitting || !file}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
