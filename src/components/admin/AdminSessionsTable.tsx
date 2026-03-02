import { useState } from 'react';
import { useAdminSessions } from '@/hooks/useAdminSessions';
import { useAdminDisputes } from '@/hooks/useAdminDisputes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, MessageCircle, Video, Calendar, Flag, Loader2 } from 'lucide-react';

export const AdminSessionsTable = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { sessions, isLoading } = useAdminSessions(statusFilter, typeFilter);
  const { createDispute } = useAdminDisputes();

  const [flagSessionId, setFlagSessionId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);

  const handleFlag = async () => {
    if (!flagSessionId || !flagReason.trim()) return;
    setIsFlagging(true);
    try {
      await createDispute(flagSessionId, flagReason.trim());
      setFlagSessionId(null);
      setFlagReason('');
    } catch (err) {
      console.error('Failed to create dispute:', err);
    } finally {
      setIsFlagging(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Phone className="w-3.5 h-3.5" />;
      case 'video': return <Video className="w-3.5 h-3.5" />;
      case 'chat': return <MessageCircle className="w-3.5 h-3.5" />;
      default: return <Phone className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt || !endedAt) return '—';
    const seconds = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Sessions</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">No Sessions Found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Advisor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">{s.client_name}</TableCell>
                  <TableCell className="font-medium">{s.advisor_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      {getTypeIcon(s.type)}
                      <span className="capitalize">{s.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(s.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.billable_minutes != null ? `${s.billable_minutes} min` : formatDuration(s.started_at, s.ended_at)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {s.cost_total != null ? `$${s.cost_total.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.started_at
                      ? new Date(s.started_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFlagSessionId(s.id)}
                        className="text-amber-500 hover:text-amber-600"
                      >
                        <Flag className="w-3.5 h-3.5 mr-1" />
                        Flag
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
            Showing {sessions.length} sessions
          </div>
        </div>
      )}
      {/* Flag dispute dialog */}
      <Dialog open={!!flagSessionId} onOpenChange={() => { setFlagSessionId(null); setFlagReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flag Session for Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm">Reason</Label>
              <Textarea
                placeholder="Describe the issue with this session..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setFlagSessionId(null); setFlagReason(''); }}>
                Cancel
              </Button>
              <Button onClick={handleFlag} disabled={isFlagging || !flagReason.trim()}>
                {isFlagging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
                Create Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
