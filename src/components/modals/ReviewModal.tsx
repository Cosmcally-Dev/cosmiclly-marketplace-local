import { useState } from 'react';
import { Star, ThumbsUp, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Advisor } from '@/data/advisors';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisor: Advisor;
  sessionType: 'chat' | 'call';
  sessionDuration: number;
  creditsUsed: number;
}

export const ReviewModal = ({
  isOpen,
  onClose,
  advisor,
  sessionType,
  sessionDuration,
  creditsUsed,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSubmit = () => {
    // In a real app, this would send the review to an API
    console.log('Review submitted:', { rating, review, advisor: advisor.id });
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setRating(0);
      setReview('');
    }, 2000);
  };

  const handleSkip = () => {
    onClose();
    setRating(0);
    setReview('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Thank you!</h3>
            <p className="text-muted-foreground">Your review helps others find great advisors.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">How was your {sessionType}?</DialogTitle>
            </DialogHeader>

            {/* Session Summary */}
            <div className="flex items-center justify-center gap-4 py-4 border-b border-border">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
              />
              <div className="text-left">
                <h4 className="font-semibold text-foreground">{advisor.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Duration: {formatDuration(sessionDuration)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Credits used: ${creditsUsed.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="py-4">
              <p className="text-center text-muted-foreground mb-3">Rate your experience</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'text-accent fill-accent'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <Textarea
              placeholder="Share your experience (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleSkip}>
                Skip
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={handleSubmit}
                disabled={rating === 0}
              >
                Submit Review
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
