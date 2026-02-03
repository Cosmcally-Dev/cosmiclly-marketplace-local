import { useState } from 'react';
import { Star, Clock, MessageCircle, Bell, Phone, Video, Award } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/modals/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { addToRecentlyViewed } from '@/components/home/RecentlyViewedSection';
import type { Advisor } from '@/data/advisors';
import aiTwinIcon from '@/assets/ai-twin-icon.png';
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

// Status ring colors - using semantic colors that complement the palette
const getStatusRingClass = (status: Advisor['status']) => {
  switch (status) {
    case 'online':
      return 'ring-4 ring-emerald-500/80 ring-offset-2 ring-offset-card';
    case 'busy':
      return 'ring-4 ring-rose-500/50 ring-offset-2 ring-offset-card';
    case 'offline':
      return 'ring-4 ring-muted/50 ring-offset-2 ring-offset-card';
    default:
      return '';
  }
};

export const AdvisorCard = ({ advisor, onChat }: AdvisorCardProps) => {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'chat' | 'call' | null>(null);
  const { isAuthenticated } = useAuth();

  const profileUrl = `/advisor/${advisor.id}`;

  const handleProfileClick = () => {
    addToRecentlyViewed(advisor.id);
  };

  const handleChatClick = () => {
    if (!isAuthenticated) {
      setPendingAction('chat');
      setIsAuthOpen(true);
      return;
    }
    navigate(`/chat/${advisor.id}`);
  };

  const handleCallClick = () => {
    if (!isAuthenticated) {
      setPendingAction('call');
      setIsAuthOpen(true);
      return;
    }
    navigate(`/call/${advisor.id}`);
  };

  const handleVideoClick = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    navigate(`/video/${advisor.id}`);
  };

  const handleAIClick = () => {
    navigate(`/advisor/${advisor.id}/ai`);
  };

  const handleAuthClose = () => {
    setIsAuthOpen(false);
    setPendingAction(null);
  };

  return (
    <TooltipProvider>
      <article className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 card-shadow h-full">
        {/* Top Left Badges - Only Top Rated and New */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          {advisor.isTopRated && (
            <Badge className="bg-secondary text-secondary-foreground font-sans font-bold text-xs shadow-lg">
              <Award className="w-3 h-3 mr-1" />
              Top Rated
            </Badge>
          )}
          {advisor.isNew && (
            <Badge className="bg-primary text-primary-foreground font-sans font-medium text-xs">
              New
            </Badge>
          )}
        </div>

        {/* Avatar Section - Clickable Link with Status Ring */}
        <Link 
          to={profileUrl} 
          onClick={handleProfileClick}
          className="block relative pt-8 px-5"
        >
          <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24">
            <img
              src={advisor.avatar}
              alt={advisor.name}
              className={`w-full h-full rounded-full object-cover transition-all ${getStatusRingClass(advisor.status)}`}
            />
            {/* Small status dot indicator */}
            {advisor.status === 'online' && (
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="p-5 pt-4 text-center">
          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(advisor.rating)
                    ? 'text-primary fill-primary'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
            <span className="ml-1 text-sm font-sans font-medium text-foreground">{advisor.rating}</span>
          </div>

          {/* Name - Clickable Link */}
          <Link 
            to={profileUrl} 
            onClick={handleProfileClick}
            className="block"
          >
            <h3 className="font-heading text-base font-semibold text-foreground hover:text-primary transition-colors">
              {advisor.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mb-2">{advisor.title}</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 text-xs text-foreground/70 mb-3">
            <span className="flex items-center gap-1 font-sans">
              <MessageCircle className="w-3 h-3" />
              {advisor.readingsCount.toLocaleString()} readings
            </span>
          </div>

          {/* Specialties - Violet Pills */}
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            {advisor.specialties.slice(0, 2).map((specialty) => (
              <span
                key={specialty}
                className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-secondary/20 text-secondary border border-secondary/30"
              >
                {specialty}
              </span>
            ))}
          </div>

          {/* Pricing - Enhanced Display */}
          <div className="flex items-center justify-center gap-2 mb-3 font-sans">
            {advisor.freeMinutes && (
              <span className="text-xs font-bold text-primary">
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
            <div className="flex justify-center gap-2.5 mt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleChatClick}
                    className="w-11 h-11 font-sans bg-primary hover:bg-primary/90 text-primary-foreground"
                    aria-label="Chat with advisor"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleCallClick}
                    className="w-11 h-11 font-sans bg-primary hover:bg-primary/90 text-primary-foreground"
                    aria-label="Call advisor"
                  >
                    <Phone className="w-5 h-5" />
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
                    className="w-11 h-11 font-sans border-primary/30 hover:bg-primary/10"
                    aria-label="Video call advisor"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAIClick}
                    className="w-11 h-11 font-sans border-primary/30 hover:bg-primary/10"
                    aria-label="Chat with AI Twin"
                  >
                    <img 
                      src={aiTwinIcon} 
                      alt="AI Twin" 
                      className="w-5 h-5 object-contain"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Twin</TooltipContent>
              </Tooltip>
            </div>
          ) : advisor.status === 'busy' ? (
            <Button variant="outline" size="sm" className="w-full font-sans">
              <Bell className="w-4 h-4 mr-2" />
              Notify Me
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="w-full font-sans" disabled>
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
      </article>
    </TooltipProvider>
  );
};
