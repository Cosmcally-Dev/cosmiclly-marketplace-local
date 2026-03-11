import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useAdvisors } from '@/hooks/useAdvisors';
import type { AdminReview, CreateReviewInput, UpdateReviewInput } from '@/hooks/useAdminReviews';

interface AdminReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateReview: (input: CreateReviewInput) => Promise<void>;
  onUpdateReview: (reviewId: string, updates: UpdateReviewInput) => Promise<void>;
  editReview?: AdminReview | null;
}

function toLocalDateString(isoString?: string): string {
  if (!isoString) return new Date().toISOString().split('T')[0];
  return new Date(isoString).toISOString().split('T')[0];
}

export function AdminReviewModal({
  isOpen,
  onClose,
  onCreateReview,
  onUpdateReview,
  editReview,
}: AdminReviewModalProps) {
  const { advisors, isLoading: advisorsLoading } = useAdvisors();

  const [advisorId, setAdvisorId] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [reviewDate, setReviewDate] = useState(toLocalDateString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!editReview;

  // Reset form when modal opens/closes or editReview changes
  useEffect(() => {
    if (isOpen && editReview) {
      setAdvisorId(editReview.advisor_id);
      setReviewerName(editReview.reviewer_display_name || '');
      setRating(editReview.rating);
      setReviewText(editReview.review_text || '');
      setSessionType(editReview.session_type || '');
      setReviewDate(toLocalDateString(editReview.created_at));
    } else if (isOpen) {
      setAdvisorId('');
      setReviewerName('');
      setRating(5);
      setReviewText('');
      setSessionType('');
      setReviewDate(toLocalDateString());
    }
    setError('');
  }, [isOpen, editReview]);

  const handleSubmit = async () => {
    if (!advisorId) {
      setError('Please select an advisor.');
      return;
    }
    if (!reviewerName.trim()) {
      setError('Reviewer name is required.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const createdAt = new Date(reviewDate + 'T12:00:00Z').toISOString();

      if (isEditMode && editReview) {
        await onUpdateReview(editReview.id, {
          rating,
          review_text: reviewText,
          reviewer_display_name: reviewerName.trim(),
          session_type: sessionType || undefined,
          created_at: createdAt,
        });
      } else {
        await onCreateReview({
          advisor_id: advisorId,
          rating,
          review_text: reviewText || undefined,
          reviewer_display_name: reviewerName.trim(),
          session_type: sessionType || undefined,
          created_at: createdAt,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save review.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Review' : 'Add Review'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Advisor Select */}
          <div className="space-y-2">
            <Label>Advisor</Label>
            <Select value={advisorId} onValueChange={setAdvisorId} disabled={isEditMode || advisorsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={advisorsLoading ? 'Loading advisors...' : 'Select an advisor'} />
              </SelectTrigger>
              <SelectContent>
                {advisors.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reviewer Name */}
          <div className="space-y-2">
            <Label>Reviewer Display Name</Label>
            <Input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder='e.g. "Sarah M." or "John D."'
            />
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-colors"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-none text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label>Review Text (optional)</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write the review content..."
              rows={3}
            />
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label>Session Type (optional)</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Review Date</Label>
            <Input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              max={toLocalDateString()}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isSaving}>
              {isEditMode ? 'Save Changes' : 'Create Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
