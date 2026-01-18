import { MessageCircle, Phone, Clock, CreditCard } from 'lucide-react';
import { useAuth, type SessionLog } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SessionHistory = () => {
  const { sessionLogs } = useAuth();

  if (sessionLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-2">No session history</h3>
        <p className="text-sm text-muted-foreground">
          Your chat and call history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessionLogs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              log.type === 'chat' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-mystic-purple/20 text-mystic-purple'
            }`}>
              {log.type === 'chat' ? (
                <MessageCircle className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{log.advisorName}</p>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-secondary">
                  {log.type}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(log.timestamp)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {formatDuration(log.duration)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CreditCard className="w-3.5 h-3.5" />
              ${log.creditsUsed.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
