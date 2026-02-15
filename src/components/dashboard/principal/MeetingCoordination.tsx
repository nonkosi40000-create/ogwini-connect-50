import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Plus, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_type: string;
  meeting_date: string;
  end_time: string | null;
  location: string | null;
  agenda: string | null;
  minutes: string | null;
  status: string;
  attendees: string[] | null;
  created_at: string;
}

export function MeetingCoordination() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState<string | null>(null);
  const [minutesText, setMinutesText] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", meeting_type: "staff",
    meeting_date: "", end_time: "", location: "", agenda: "",
    attendees: [] as string[],
  });

  const fetchMeetings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false });
    if (data) setMeetings(data as Meeting[]);
    setLoading(false);
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.meeting_date) {
      toast({ title: "Error", description: "Title and date are required.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('meetings').insert({
      ...form,
      created_by: user?.id,
      end_time: form.end_time || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Meeting Scheduled" });
      setShowForm(false);
      setForm({ title: "", description: "", meeting_type: "staff", meeting_date: "", end_time: "", location: "", agenda: "", attendees: [] });
      fetchMeetings();
    }
  };

  const handleSaveMinutes = async (meetingId: string) => {
    const { error } = await supabase.from('meetings').update({
      minutes: minutesText,
      status: 'completed',
    }).eq('id', meetingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Minutes Saved" });
      setEditingMinutes(null);
      setMinutesText("");
      fetchMeetings();
    }
  };

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date());
  const pastMeetings = meetings.filter(m => m.status === 'completed' || new Date(m.meeting_date) < new Date());

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">Meeting Coordination</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
        </Button>
      </div>

      {/* New Meeting Form */}
      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">New Meeting</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input placeholder="Meeting Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff Meeting</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="smt">SMT Meeting</SelectItem>
                <SelectItem value="departmental">Departmental</SelectItem>
                <SelectItem value="disciplinary">Disciplinary</SelectItem>
                <SelectItem value="parent">Parent Meeting</SelectItem>
              </SelectContent>
            </Select>
            <Input type="datetime-local" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
            <Input type="datetime-local" placeholder="End Time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <Textarea placeholder="Agenda items (one per line)" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={4} />
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Schedule Meeting</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Upcoming Meetings */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Upcoming Meetings ({upcomingMeetings.length})
        </h3>
        {upcomingMeetings.length === 0 ? (
          <p className="text-muted-foreground text-sm glass-card p-4 text-center">No upcoming meetings.</p>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((m) => (
              <div key={m.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{m.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.meeting_date).toLocaleString()}</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                    </div>
                  </div>
                  <Badge variant="outline">{m.meeting_type}</Badge>
                </div>
                {m.description && <p className="text-sm text-muted-foreground mb-2">{m.description}</p>}
                {m.agenda && (
                  <div className="p-3 rounded bg-secondary/50 mt-2">
                    <p className="text-xs font-medium text-foreground mb-1">Agenda:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{m.agenda}</p>
                  </div>
                )}
                {/* Add minutes */}
                {editingMinutes === m.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea value={minutesText} onChange={(e) => setMinutesText(e.target.value)} placeholder="Enter meeting minutes..." rows={4} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveMinutes(m.id)}>Save Minutes</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingMinutes(null); setMinutesText(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditingMinutes(m.id); setMinutesText(m.minutes || ""); }}>
                    <FileText className="w-4 h-4 mr-1" /> Add Minutes
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-muted-foreground" /> Past Meetings ({pastMeetings.length})
        </h3>
        {pastMeetings.length === 0 ? (
          <p className="text-muted-foreground text-sm glass-card p-4 text-center">No past meetings.</p>
        ) : (
          <div className="space-y-3">
            {pastMeetings.map((m) => (
              <div key={m.id} className="glass-card p-5 opacity-80">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{m.title}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(m.meeting_date).toLocaleString()} • {m.location || "No location"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{m.meeting_type}</Badge>
                    {m.minutes ? (
                      <Badge className="bg-primary text-primary-foreground">Minutes Recorded</Badge>
                    ) : (
                      <Badge variant="destructive">No Minutes</Badge>
                    )}
                  </div>
                </div>
                {m.minutes && (
                  <div className="p-3 rounded bg-primary/5 border border-primary/20 mt-2">
                    <p className="text-xs font-medium text-primary mb-1">Meeting Minutes:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{m.minutes}</p>
                  </div>
                )}
                {!m.minutes && m.status !== 'completed' && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditingMinutes(m.id); setMinutesText(""); }}>
                    <FileText className="w-4 h-4 mr-1" /> Add Minutes
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
