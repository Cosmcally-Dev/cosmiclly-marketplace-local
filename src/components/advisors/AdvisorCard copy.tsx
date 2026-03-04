import { useState } from 'react';
import { Star, MoonStar, MessageCircle, Phone, Video, Heart, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
      return 'ring-2 ring-cyan-500/70 ring-offset-2 ring-offset-card';
    case 'busy':
      return 'ring-2 ring-rose-500/50 ring-offset-2 ring-offset-card';
    case 'offline':
      return 'ring-2 ring-muted/50 ring-offset-2 ring-offset-card';
    default:
      return '';
  }
};

export const AdvisorCard = ({ advisor, onChat }: AdvisorCardProps) => {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'chat' | 'call' | null>(null);
  const { isAuthenticated, openAuthModal } = useAuth();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  const advisorDbId = advisor.dbId || advisor.id;
  const favorited = isFavorite(advisorDbId);

  const profileUrl = `/advisor/${advisor.id}`;

  const handleProfileClick = () => {
    addToRecentlyViewed(advisor.id);
  };

  const handleChatClick = () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    navigate(`/chat/${advisor.id}`);
  };

  const handleCallClick = () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    navigate(`/call/${advisor.id}`);
  };

  const handleVideoClick = () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    navigate(`/video/${advisor.id}`);
  };

  const handleAIClick = () => {
    navigate(`/advisor/${advisor.id}/ai`);
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
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.2)] backdrop-blur-sm">
                <Star className="w-2.5 h-2.5 fill-cyan-400 text-cyan-400 shrink-0" />
                <span className="text-[10px] font-bold font-sans tracking-wide text-cyan-400 leading-none">Top Rated</span>
              </div>
            )}
            {advisor.isNew && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.2)] backdrop-blur-sm">
                <Sparkles className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="text-[10px] font-bold font-sans tracking-wide text-primary leading-none">New</span>
              </div>
            )}
          </div>

          {/* Avatar */}
          <Link to={profileUrl} onClick={handleProfileClick} className="block">
            <div className="relative mx-auto w-24 h-24">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className={`w-full h-full rounded-full object-cover transition-all ${getStatusRingClass(advisor.status)}`}
              />
              {advisor.status === 'online' && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-card animate-pulse" />
              )}
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="px-5 pb-3 pt-2 text-center flex flex-col flex-1">

          {/* Name — clamped to 2 lines so all cards share the same height for this zone */}
          <Link to={profileUrl} onClick={handleProfileClick} className="block mb-0.5 min-h-[2.75rem] flex items-center justify-center">
            <h3 className="font-heading text-lg font-semibold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2">
              {advisor.name}
            </h3>
          </Link>

          {/* Title — single line, fixed height */}
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1 min-h-[1.25rem]">{advisor.title}</p>

          {/* Rating + reviews — single row */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
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
          <div className="flex flex-nowrap justify-center gap-1.5 mb-2 h-[2rem] items-center">
            {advisor.specialties.slice(0, 2).map((specialty) => (
              <span
                key={specialty}
                className="flex-1 min-w-0 truncate px-2.5 py-1 rounded-full text-xs font-sans font-medium text-center bg-secondary/20 text-secondary-foreground/70 border border-secondary/60"
                style={{ paddingLeft: '0.325rem', paddingRight: '0.325rem', fontSize: '0.7rem' }}
              >
                {specialty}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 mb-2" />

          {/* Free minutes accent badge — always reserves height so price row aligns across cards */}
          <div className="mb-2.5 min-h-[1.75rem] flex items-center justify-center">
            {advisor.freeMinutes != null && advisor.freeMinutes > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-sans">
                ✦ {advisor.freeMinutes} FREE minutes
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline justify-center gap-2 mb-2 font-sans">
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
              <div className="flex items-center gap-1 p-1.5 rounded-xl bg-secondary/20 border border-border/40">
                {/* Chat */}
                <button
                  onClick={handleChatClick}
                  title="Live Chat"
                  className="flex-1 flex items-center justify-center h-9 rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_0_12px_hsl(var(--primary)/0.45)] active:scale-95 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                {/* Call */}
                <button
                  onClick={handleCallClick}
                  title="Voice Call"
                  className="flex-1 flex items-center justify-center h-9 rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_0_12px_hsl(var(--primary)/0.45)] active:scale-95 transition-all duration-200"
                >
                  <Phone className="w-4 h-4" />
                </button>

                {/* Separator */}
                <div className="w-px h-5 bg-border/60 mx-0.5 shrink-0" />

                {/* Video */}
                <button
                  onClick={handleVideoClick}
                  title="Video Call"
                  className="flex-1 flex items-center justify-center h-9 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all duration-200"
                >
                  <Video className="w-4 h-4" />
                </button>

                {/* AI Twin */}
                <button
                  onClick={handleAIClick}
                  title="AI Twin"
                  className="flex-1 flex items-center justify-center h-9 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all duration-200"
                >
                  <img src={aiTwinIcon} alt="AI Twin" className="w-4 h-4 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to={profileUrl} onClick={handleProfileClick} className="block">
                  <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground text-sm font-sans font-medium hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer">
                    <MoonStar className="w-4 h-4" />
                    <span>View Profile</span>
                  </div>
                </Link>
                {advisor.twinEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleAIClick}
                    className="w-full font-sans border-secondary/60 hover:bg-secondary/30 text-muted-foreground hover:text-foreground text-xs h-9"
                  >
                    <img src={aiTwinIcon} alt="" className="w-3.5 h-3.5 mr-1.5 object-contain" />
                    AI Twin — Available 24/7
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

      </article>
    </TooltipProvider>
  );
};
