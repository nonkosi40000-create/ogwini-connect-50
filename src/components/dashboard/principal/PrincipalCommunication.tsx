import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export function PrincipalCommunication() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffMessage, setStaffMessage] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const sendStaffMessage = async () => {
    if (!staffMessage.trim()) return;
    try {
      await supabase.from('announcements').insert({
        title: `Message from Principal`,
        content: staffMessage,
        type: 'announcement',
        created_by: user?.id,
        target_audience: selectedStaff.length > 0 ? selectedStaff : ['teachers', 'grade_heads', 'admin'],
      });
      toast({ title: "Message Sent", description: `Your message has been sent to ${selectedStaff.length || "all"} staff members.` });
      setStaffMessage("");
      setSelectedStaff([]);
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Staff Communication</h2>
      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Select Recipients</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All Staff", value: [] },
              { label: "Teachers", value: ["teachers"] },
              { label: "Grade Heads", value: ["grade_heads"] },
              { label: "HODs", value: ["hod"] },
              { label: "Admin", value: ["admin"] },
              { label: "Finance", value: ["finance"] },
            ].map((opt) => (
              <Button
                key={opt.label}
                variant={JSON.stringify(selectedStaff) === JSON.stringify(opt.value) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStaff(opt.value)}
              >{opt.label}</Button>
            ))}
          </div>
        </div>
        <Textarea value={staffMessage} onChange={(e) => setStaffMessage(e.target.value)} placeholder="Type your message..." rows={4} />
        <Button onClick={sendStaffMessage} className="w-full">
          <Send className="w-4 h-4 mr-2" /> Send Message
        </Button>
      </div>
    </div>
  );
}
