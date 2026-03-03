import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { AdminApplication } from '@/hooks/useAdminApplications';

interface ContractTerms {
  advisorShare: number;
  platformShare: number;
  adminFee: number;
}

interface AdminApplicationReviewProps {
  application: AdminApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, notes?: string, contract?: ContractTerms) => Promise<boolean>;
  onReject: (id: string, notes: string) => Promise<boolean>;
}

export const AdminApplicationReview = ({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: AdminApplicationReviewProps) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advisorShare, setAdvisorShare] = useState('50');
  const [platformShare, setPlatformShare] = useState('50');
  const [adminFee, setAdminFee] = useState('5');
  const [contractError, setContractError] = useState('');

  if (!application) return null;

  const isPending = application.status === 'pending';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAdvisorShareChange = (val: string) => {
    setAdvisorShare(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPlatformShare((100 - num).toFixed(0));
      setContractError('');
    }
  };

  const handlePlatformShareChange = (val: string) => {
    setPlatformShare(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setAdvisorShare((100 - num).toFixed(0));
      setContractError('');
    }
  };

  const handleApprove = async () => {
    const aShare = parseFloat(advisorShare);
    const pShare = parseFloat(platformShare);
    const fee = parseFloat(adminFee);

    if (isNaN(aShare) || isNaN(pShare) || isNaN(fee)) {
      setContractError('All contract fields must be valid numbers');
      return;
    }
    if (aShare + pShare !== 100) {
      setContractError('Advisor + Platform share must equal 100%');
      return;
    }
    if (fee < 0 || fee > 100) {
      setContractError('Admin fee must be between 0 and 100');
      return;
    }

    setContractError('');
    setIsSubmitting(true);
    const success = await onApprove(application.id, notes || undefined, {
      advisorShare: aShare,
      platformShare: pShare,
      adminFee: fee,
    });
    setIsSubmitting(false);
    if (success) {
      setNotes('');
      onClose();
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) return;
    setIsSubmitting(true);
    const success = await onReject(application.id, notes);
    setIsSubmitting(false);
    if (success) {
      setNotes('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setNotes(''); onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Application Review
            {getStatusBadge(application.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Full Name</Label>
              <p className="text-foreground font-medium">{application.full_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-foreground font-medium text-sm">{application.email}</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Specialties</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {application.specialty.split(', ').map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>

          {application.social_link && (
            <div>
              <Label className="text-muted-foreground text-xs">Social Link</Label>
              <a
                href={application.social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm flex items-center gap-1 hover:underline"
              >
                {application.social_link}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {application.extra_info && (
            <div>
              <Label className="text-muted-foreground text-xs">Additional Information</Label>
              <p className="text-foreground text-sm mt-1">{application.extra_info}</p>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-xs">Submitted</Label>
            <p className="text-foreground text-sm">
              {application.submitted_at
                ? new Date(application.submitted_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                : 'Unknown'}
            </p>
          </div>

          {/* Show review info for processed applications */}
          {!isPending && application.reviewed_at && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-muted-foreground text-xs">Reviewed</Label>
              <p className="text-foreground text-sm">
                {new Date(application.reviewed_at).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              {application.notes && (
                <div className="mt-2">
                  <Label className="text-muted-foreground text-xs">Admin Notes</Label>
                  <p className="text-foreground text-sm">{application.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Action area for pending applications */}
          {isPending && (
            <>
              {/* Contract Terms */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <Label className="text-foreground font-medium text-sm">Contract Terms</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Advisor Share %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={advisorShare}
                      onChange={(e) => handleAdvisorShareChange(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Platform Share %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={platformShare}
                      onChange={(e) => handlePlatformShareChange(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Admin Fee %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={adminFee}
                      onChange={(e) => { setAdminFee(e.target.value); setContractError(''); }}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Example: $100 session → {adminFee}% admin fee (${(100 * parseFloat(adminFee || '0') / 100).toFixed(2)}) → ${(100 - 100 * parseFloat(adminFee || '0') / 100).toFixed(2)} remaining → {advisorShare}% advisor / {platformShare}% platform
                </p>
                {contractError && (
                  <p className="text-xs text-red-500">{contractError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Notes (required for rejection)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add notes about this application..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={handleReject}
                  disabled={isSubmitting || !notes.trim()}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
