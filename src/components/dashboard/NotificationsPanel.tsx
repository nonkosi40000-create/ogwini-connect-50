import { useState, useEffect } from "react";
import { Bell, Calendar, FileText, AlertTriangle, Info, Download, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  link_label: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  notifications: Announcement[];
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'urgent':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'event':
      return <Calendar className="w-4 h-4 text-accent" />;
    case 'marks':
    case 'statement':
      return <FileText className="w-4 h-4 text-primary" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const getNotificationBadge = (type: string) => {
  switch (type) {
    case 'urgent':
      return <Badge variant="destructive">Urgent</Badge>;
    case 'event':
      return <Badge variant="secondary">Event</Badge>;
    case 'marks':
      return <Badge className="bg-primary">Marks</Badge>;
    case 'statement':
      return <Badge className="bg-primary">Statement</Badge>;
    default:
      return <Badge variant="outline">Info</Badge>;
  }
};

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchUserNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setUserNotifications(data as UserNotification[]);
    };
    fetchUserNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setUserNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Merge announcements and user notifications into a single sorted list
  const allItems = [
    ...notifications.map(n => ({ ...n, source: 'announcement' as const, message: n.content, link_url: null, link_label: null, is_read: true })),
    ...userNotifications.map(n => ({ ...n, source: 'notification' as const, content: n.message })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = userNotifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          {(allItems.length > 0 || unreadCount > 0) && (
            <Badge className="bg-primary">{unreadCount > 0 ? `${unreadCount} new` : allItems.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {allItems.length > 0 ? (
          allItems.slice(0, 15).map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className={`p-3 rounded-lg border transition-colors ${
                !item.is_read
                  ? "bg-primary/5 border-primary/20"
                  : "bg-secondary/50 border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {item.title}
                    </h4>
                    {getNotificationBadge(item.type)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.source === 'announcement' ? item.content : item.message}
                  </p>
                  {item.link_url && (
                    <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        {item.link_label || "Download"}
                      </Button>
                    </a>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.source === 'notification' && !item.is_read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}