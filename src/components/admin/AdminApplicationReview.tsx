import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { AdminApplication } from '@/hooks/useAdminApplications';

interface AdminApplicationReviewProps {
  application: AdminApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => Promise<boolean>;
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

  const handleApprove = async () => {
    setIsSubmitting(true);
    const success = await onApprove(application.id, notes || undefined);
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
