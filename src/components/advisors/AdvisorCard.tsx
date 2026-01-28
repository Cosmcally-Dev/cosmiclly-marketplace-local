import { useState } from 'react';
import { Star, Clock, MessageCircle, Bell, Phone, Video, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/modals/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { addToRecentlyViewed } from '@/components/home/RecentlyViewedSection';
import type { Advisor } from '@/data/advisors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdvisorCardProps {
  advisor: Advisor;
  onChat?: (advisor: Advisor) => void;
}

const StatusBadge = ({ status }: { status: Advisor['status'] }) => {
  const statusConfig = {
    online: { label: 'ONLINE', className: 'status-online' },
    busy: { label: 'BUSY', className: 'status-busy' },
    offline: { label: 'OFFLINE', className: 'status-offline' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white ${config.className}`}>
      {status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      {config.label}
    </span>
  );
};

export const AdvisorCard = ({ advisor, onChat }: AdvisorCardProps) => {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'chat' | 'call' | null>(null);
  const { isAuthenticated } = useAuth();

  const handleCardClick = (e: React.MouseEvent) => {
    addToRecentlyViewed(advisor.id);
    navigate(`/advisor/${advisor.id}`);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setPendingAction('chat');
      setIsAuthOpen(true);
      return;
    }
    
    navigate(`/chat/${advisor.id}`);
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setPendingAction('call');
      setIsAuthOpen(true);
      return;
    }
    
    navigate(`/call/${advisor.id}`);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    
    navigate(`/video/${advisor.id}`);
  };

  const handleAIClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to AI Twin feature
    navigate(`/advisor/${advisor.id}/ai`);
  };

  const handleAuthClose = () => {
    setIsAuthOpen(false);
    setPendingAction(null);
  };

  return (
    <TooltipProvider>
      <div 
        onClick={handleCardClick}
        className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 card-shadow cursor-pointer h-full"
      >
        {/* Top Rated Badge */}
        {advisor.isTopRated && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-accent text-accent-foreground font-medium text-xs">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Top Rated
            </Badge>
          </div>
        )}

        {advisor.isNew && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-primary text-primary-foreground font-medium text-xs">
              New
            </Badge>
          </div>
        )}

        {/* AI Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAIClick}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
              >
                <Bot className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat with AI Twin</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Avatar Section */}
        <div className="relative pt-5 px-4">
          <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24">
            <img
              src={advisor.avatar}
              alt={advisor.name}
              className="w-full h-full rounded-full object-cover border-2 border-primary/30 group-hover:border-primary transition-colors"
            />
            <div className="absolute -bottom-1 right-0">
              <StatusBadge status={advisor.status} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 text-center">
          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(advisor.rating)
                    ? 'text-accent fill-accent'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
            <span className="ml-1 text-sm font-medium text-foreground">{advisor.rating}</span>
          </div>

          {/* Name & Title */}
          <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {advisor.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">{advisor.title}</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {advisor.readingsCount.toLocaleString()}
            </span>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            {advisor.specialties.slice(0, 2).map((specialty) => (
              <span
                key={specialty}
                className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground"
              >
                {specialty}
              </span>
            ))}
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {advisor.freeMinutes && (
              <span className="text-xs font-medium text-accent">
                {advisor.freeMinutes} free min
              </span>
            )}
            {advisor.discountedPrice ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground line-through">
                  ${advisor.pricePerMinute}
                </span>
                <span className="text-sm font-bold text-primary">
                  ${advisor.discountedPrice}/min
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-primary">
                ${advisor.pricePerMinute}/min
              </span>
            )}
          </div>

          {/* Action Buttons - Icons Only */}
          {advisor.status === 'online' ? (
            <div className="flex justify-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="hero"
                    size="icon"
                    onClick={handleChatClick}
                    className="w-10 h-10"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCallClick}
                    className="w-10 h-10"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Call</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleVideoClick}
                    className="w-10 h-10"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video</TooltipContent>
              </Tooltip>
            </div>
          ) : advisor.status === 'busy' ? (
            <Button variant="outline" size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
              <Bell className="w-4 h-4 mr-2" />
              Notify Me
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="w-full" disabled onClick={(e) => e.stopPropagation()}>
              <Clock className="w-4 h-4 mr-2" />
              Offline
            </Button>
          )}
        </div>
        
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={handleAuthClose} 
          mode="signin"
        />
      </div>
    </TooltipProvider>
  );
};
