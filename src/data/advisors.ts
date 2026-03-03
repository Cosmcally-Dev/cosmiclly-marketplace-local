export interface Advisor {
  id: string;
  dbId?: string; // Real database UUID for RPC calls (profiles table id)
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  readingsCount: number;
  yearStarted: number;
  status: 'online' | 'busy' | 'offline';
  pricePerMinute: number;
  discountedPrice?: number;
  freeMinutes?: number;
  specialties: string[];
  description: string;
  isTopRated?: boolean;
  isNew?: boolean;
  twinEnabled?: boolean;
  vapiAgentId?: string;
}

// Advisors are now loaded from Supabase via the useAdvisors() hook.
// This empty array is kept for backwards compatibility with any remaining imports.
export const advisors: Advisor[] = [];
