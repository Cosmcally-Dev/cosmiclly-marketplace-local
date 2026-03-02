import { useState } from 'react';
import { useAdminDisputes } from '@/hooks/useAdminDisputes';
import { AdminDisputeDetail } from '@/components/admin/AdminDisputeDetail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Eye } from 'lucide-react';
import type { Dispute } from '@/hooks/useAdminDisputes';

const statusColors: Record<string, string> = {
  open: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  investigating: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-500 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export const AdminDisputeCenter = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { disputes, isLoading, updateDisputeStatus, issueRefund } = useAdminDisputes(statusFilter);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dispute Center</h1>

      <div className="flex items-center gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disputes</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">No Disputes Found</h3>
          <p className="text-muted-foreground text-sm">
            {statusFilter !== 'all' ? 'Try a different status filter.' : 'No disputes have been filed yet.'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Advisor</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {d.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">{d.client_name}</TableCell>
                  <TableCell className="font-medium">{d.advisor_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {d.reason}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[d.status] || ''}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {d.refund_amount_cents > 0 ? `$${(d.refund_amount_cents / 100).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDispute(d)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
            Showing {disputes.length} disputes
          </div>
        </div>
      )}

      <AdminDisputeDetail
        dispute={selectedDispute}
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        onUpdateStatus={updateDisputeStatus}
        onIssueRefund={issueRefund}
      />
    </div>
  );
};
