import { useState } from 'react';
import { Star, Clock, MessageCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/modals/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import type { Advisor } from '@/data/advisors';

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
  const { isAuthenticated } = useAuth();

  const handleCardClick = (e: React.MouseEvent) => {
    navigate(`/advisor/${advisor.id}`);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    
    navigate(`/chat/${advisor.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 card-shadow cursor-pointer"
    >
      {/* Top Rated Badge */}
      {advisor.isTopRated && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-accent text-accent-foreground font-medium">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Top Rated
          </Badge>
        </div>
      )}

      {advisor.isNew && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-primary text-primary-foreground font-medium">
            New
          </Badge>
        </div>
      )}

      {/* Avatar Section */}
      <div className="relative pt-6 px-6">
        <div className="relative mx-auto w-24 h-24 md:w-28 md:h-28">
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
      <div className="p-4 md:p-6 text-center">
        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(advisor.rating)
                  ? 'text-accent fill-accent'
                  : 'text-muted-foreground'
              }`}
            />
          ))}
          <span className="ml-1 text-sm font-medium text-foreground">{advisor.rating}</span>
        </div>

        {/* Name & Title */}
        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {advisor.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{advisor.title}</p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {advisor.readingsCount.toLocaleString()} readings
          </span>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {advisor.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {advisor.freeMinutes && (
            <span className="text-sm font-medium text-accent">
              {advisor.freeMinutes} free min
            </span>
          )}
          {advisor.discountedPrice ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground line-through">
                ${advisor.pricePerMinute}/min
              </span>
              <span className="text-lg font-bold text-primary">
                ${advisor.discountedPrice}/min
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-primary">
              ${advisor.pricePerMinute}/min
            </span>
          )}
        </div>

        {/* Action Button */}
        {advisor.status === 'online' ? (
          <Button
            variant="hero"
            className="w-full"
            onClick={handleChatClick}
          >
            Chat Now
          </Button>
        ) : advisor.status === 'busy' ? (
          <Button variant="outline" className="w-full" onClick={(e) => e.stopPropagation()}>
            <Bell className="w-4 h-4 mr-2" />
            Notify Me
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" disabled onClick={(e) => e.stopPropagation()}>
            <Clock className="w-4 h-4 mr-2" />
            Offline
          </Button>
        )}
      </div>
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        mode="signin"
      />
    </div>
  );
};
