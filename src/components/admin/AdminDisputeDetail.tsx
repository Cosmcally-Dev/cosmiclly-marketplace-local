import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DollarSign, CheckCircle, XCircle, Search } from 'lucide-react';
import type { Dispute } from '@/hooks/useAdminDisputes';

interface AdminDisputeDetailProps {
  dispute: Dispute | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    disputeId: string,
    status: 'investigating' | 'resolved' | 'rejected',
    resolution?: string,
    refundAmountCents?: number
  ) => Promise<void>;
  onIssueRefund: (sessionId: string, refundCredits: number, reason: string) => Promise<any>;
}

const statusColors: Record<string, string> = {
  open: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  investigating: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-500 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export function AdminDisputeDetail({
  dispute,
  isOpen,
  onClose,
  onUpdateStatus,
  onIssueRefund,
}: AdminDisputeDetailProps) {
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refundResult, setRefundResult] = useState<string | null>(null);

  if (!dispute) return null;

  const maxRefund = dispute.session_cost ?? 0;
  const isResolved = dispute.status === 'resolved' || dispute.status === 'rejected';

  const handleInvestigate = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await onUpdateStatus(dispute.id, 'investigating');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveWithRefund = async () => {
    setIsProcessing(true);
    setActionError(null);
    setRefundResult(null);
    try {
      const credits = parseFloat(refundAmount);
      if (isNaN(credits) || credits <= 0) {
        throw new Error('Enter a valid refund amount');
      }
      if (credits > maxRefund) {
        throw new Error(`Refund cannot exceed session cost ($${maxRefund.toFixed(2)})`);
      }

      // Issue the refund
      const result = await onIssueRefund(dispute.session_id, credits, resolution || dispute.reason);

      // Update dispute status
      await onUpdateStatus(dispute.id, 'resolved', resolution || 'Refund issued', Math.round(credits * 100));

      setRefundResult(
        `Refunded $${credits.toFixed(2)} credits.${result.stripe_refunded ? ' Stripe refund also issued.' : ''}`
      );
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await onUpdateStatus(dispute.id, 'rejected', resolution || 'Dispute rejected');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Dispute Details
            <Badge className={statusColors[dispute.status] || ''}>
              {dispute.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Session info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Client</p>
              <p className="font-medium">{dispute.client_name}</p>
              <p className="text-xs text-muted-foreground">{dispute.client_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Advisor</p>
              <p className="font-medium">{dispute.advisor_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Session Type</p>
              <p className="capitalize font-medium">{dispute.session_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Session Cost</p>
              <p className="font-medium font-mono">
                {dispute.session_cost != null ? `$${dispute.session_cost.toFixed(2)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Opened</p>
              <p className="font-medium">{new Date(dispute.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Session ID</p>
              <p className="font-mono text-xs">{dispute.session_id.slice(0, 12)}...</p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Reason</p>
            <p className="text-sm">{dispute.reason}</p>
          </div>

          {/* Existing resolution */}
          {dispute.resolution && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Resolution</p>
              <p className="text-sm">{dispute.resolution}</p>
              {dispute.refund_amount_cents > 0 && (
                <p className="text-sm font-mono mt-1 text-primary">
                  Refunded: ${(dispute.refund_amount_cents / 100).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Actions for open/investigating disputes */}
          {!isResolved && (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Resolution Notes</Label>
                  <Textarea
                    placeholder="Describe the resolution..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-xs">Refund Amount (credits)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxRefund}
                      placeholder={`Max: ${maxRefund.toFixed(2)}`}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {actionError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
                  {actionError}
                </p>
              )}

              {refundResult && (
                <p className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                  {refundResult}
                </p>
              )}

              <div className="flex flex-col gap-2">
                {dispute.status === 'open' && (
                  <Button
                    variant="outline"
                    onClick={handleInvestigate}
                    loading={isProcessing}
                    className="w-full"
                  >
                    {!isProcessing && <Search className="w-4 h-4 mr-2" />}
                    Mark as Investigating
                  </Button>
                )}

                <Button
                  onClick={handleResolveWithRefund}
                  disabled={!refundAmount}
                  loading={isProcessing}
                  className="w-full"
                >
                  {!isProcessing && <CheckCircle className="w-4 h-4 mr-2" />}
                  Issue Refund & Resolve
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleReject}
                  loading={isProcessing}
                  className="w-full"
                >
                  {!isProcessing && <XCircle className="w-4 h-4 mr-2" />}
                  Reject Dispute
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
