import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import aiTwinIcon from '@/assets/ai-twin-icon.png';

interface TwinChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisorId: string;
  vapiAgentId?: string;
}

export const TwinChoiceModal = ({ isOpen, onClose, advisorId, vapiAgentId }: TwinChoiceModalProps) => {
  const voiceAvailable = !!vapiAgentId;
  const navigate = useNavigate();

  const handleChat = () => {
    onClose();
    navigate(`/advisor/${advisorId}/ai`);
  };

  const handleCall = () => {
    onClose();
    navigate(`/advisor/${advisorId}/ai-voice`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm bg-card border-border p-0 overflow-hidden">
        <div className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={aiTwinIcon} alt="" className="w-7 h-7 object-contain" />
            <h3 className="font-heading text-lg font-semibold text-foreground">AI Twin</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Choose how you'd like to connect
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleChat}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-foreground border border-primary/30 hover:border-primary/50 transition-all"
              variant="ghost"
            >
              <MessageCircle className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Twin Chat</span>
            </Button>

            <Button
              onClick={handleCall}
              disabled={!voiceAvailable}
              className="h-20 flex flex-col items-center justify-center gap-1.5 bg-secondary/10 hover:bg-secondary/20 text-foreground border border-secondary/30 hover:border-secondary/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-secondary/10 disabled:hover:border-secondary/30"
              variant="ghost"
            >
              <Phone className="w-6 h-6 text-secondary" />
              <span className="text-sm font-medium">Twin Call</span>
              {!voiceAvailable && (
                <span className="text-[10px] text-muted-foreground">Not available yet</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
