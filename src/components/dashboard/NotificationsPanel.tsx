import { Bell, Calendar, FileText, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'urgent':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'event':
      return <Calendar className="w-4 h-4 text-accent" />;
    case 'marks':
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
    default:
      return <Badge variant="outline">Info</Badge>;
  }
};

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          {notifications.length > 0 && (
            <Badge className="bg-primary">{notifications.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {notification.title}
                    </h4>
                    {getNotificationBadge(notification.type)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
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
