import { useState } from 'react';
import { Star, MoonStar, MessageCircle, Phone, Video, Award, Heart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/modals/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { addToRecentlyViewed } from '@/components/home/RecentlyViewedSection';
import type { Advisor } from '@/data/advisors';
import aiTwinIcon from '@/assets/ai-twin-icon.png';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';

interface AdvisorCardProps {
  advisor: Advisor;
  onChat?: (advisor: Advisor) => void;
}

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
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  const advisorDbId = advisor.dbId || advisor.id;
  const favorited = isFavorite(advisorDbId);

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
      <article className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 card-shadow h-full flex flex-col">

        {/* Avatar header area with subtle gradient background */}
        <div className="relative bg-gradient-to-b from-secondary/40 to-card pt-5 pb-7 px-5 text-center">
          {/* Favorite heart button — top-right */}
          {isAuthenticated && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(advisorDbId); }}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-background/80 transition-colors"
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'
                }`}
              />
            </button>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
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

          {/* Avatar */}
          <Link to={profileUrl} onClick={handleProfileClick} className="block">
            <div className="relative mx-auto w-24 h-24 md:w-28 md:h-28">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className={`w-full h-full rounded-full object-cover transition-all ${getStatusRingClass(advisor.status)}`}
              />
              {advisor.status === 'online' && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
              )}
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-4 text-center flex flex-col flex-1">

          {/* Name — clamped to 2 lines so all cards share the same height for this zone */}
          <Link to={profileUrl} onClick={handleProfileClick} className="block mb-0.5 min-h-[3.25rem] flex items-center justify-center">
            <h3 className="font-heading text-lg font-semibold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2">
              {advisor.name}
            </h3>
          </Link>

          {/* Title — single line, fixed height */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1 min-h-[1.25rem]">{advisor.title}</p>

          {/* Rating + reviews — single row */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
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
            </div>
            <span className="text-sm font-semibold text-foreground font-sans">{advisor.rating}</span>
            <span className="text-muted-foreground/60 text-xs">·</span>
            <span className="text-xs text-muted-foreground font-sans">
              {advisor.readingsCount.toLocaleString()} readings
            </span>
          </div>

          {/* Specialty pills — nowrap + flex-1 forces both pills onto one row always */}
          <div className="flex flex-nowrap justify-center gap-1.5 mb-4 h-[2rem] items-center">
            {advisor.specialties.slice(0, 2).map((specialty) => (
              <span
                key={specialty}
                className="flex-1 min-w-0 truncate px-2.5 py-1 rounded-full text-xs font-sans font-medium text-center bg-secondary/20 text-secondary-foreground/70 border border-secondary/60"
              >
                {specialty}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 mb-4" />

          {/* Free minutes accent badge — always reserves height so price row aligns across cards */}
          <div className="mb-2.5 min-h-[1.75rem] flex items-center justify-center">
            {advisor.freeMinutes && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-sans">
                ✦ {advisor.freeMinutes} FREE minutes
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline justify-center gap-2 mb-5 font-sans">
            {advisor.discountedPrice ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ${advisor.pricePerMinute}
                </span>
                <span className="text-xl font-bold text-primary">
                  ${advisor.discountedPrice}
                  <span className="text-sm font-normal text-muted-foreground">/min</span>
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-primary">
                ${advisor.pricePerMinute}
                <span className="text-sm font-normal text-muted-foreground">/min</span>
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-auto">
            {advisor.status === 'online' ? (
              <>
                {/* Primary: Chat + Call */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button
                    onClick={handleChatClick}
                    className="font-sans bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-10"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    Chat
                  </Button>
                  <Button
                    onClick={handleCallClick}
                    className="font-sans bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-10"
                  >
                    <Phone className="w-4 h-4 mr-1.5" />
                    Call
                  </Button>
                </div>

                {/* Secondary: Video + AI Twin */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleVideoClick}
                    className="font-sans border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground text-xs h-9"
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                    Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAIClick}
                    className="font-sans border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground text-xs h-9"
                  >
                    <img src={aiTwinIcon} alt="" className="w-3.5 h-3.5 mr-1.5 object-contain" />
                    AI Twin
                  </Button>
                </div>
              </>
            ) : (
              <Link to={profileUrl} onClick={handleProfileClick} className="block">
                <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground text-sm font-sans font-medium hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer">
                  <MoonStar className="w-4 h-4" />
                  <span>View Profile</span>
                </div>
              </Link>
            )}
          </div>
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
