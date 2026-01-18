export interface Advisor {
  id: string;
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
}

export const advisors: Advisor[] = [
  {
    id: '1',
    name: 'Psychic Luna',
    title: '5 Star Love Expert',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 5.0,
    reviewCount: 26791,
    readingsCount: 26791,
    yearStarted: 2013,
    status: 'online',
    pricePerMinute: 3.99,
    discountedPrice: 1.99,
    freeMinutes: 3,
    specialties: ['Love', 'Relationships', 'Soulmate'],
    description: 'Gifted empath and clairvoyant specializing in matters of the heart. Let me guide you to your true love.',
    isTopRated: true,
  },
  {
    id: '2',
    name: 'Master Chen',
    title: 'Astrology & Numerology',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 15234,
    readingsCount: 18500,
    yearStarted: 2015,
    status: 'online',
    pricePerMinute: 4.99,
    discountedPrice: 2.49,
    freeMinutes: 3,
    specialties: ['Astrology', 'Numerology', 'Life Path'],
    description: 'Ancient wisdom meets modern insight. Discover your cosmic destiny through the stars.',
    isTopRated: true,
  },
  {
    id: '3',
    name: 'Mystic Rose',
    title: 'Tarot Card Reader',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 8921,
    readingsCount: 12000,
    yearStarted: 2018,
    status: 'busy',
    pricePerMinute: 2.99,
    specialties: ['Tarot', 'Intuitive', 'Career'],
    description: 'Third-generation tarot reader with intuitive gifts. Every card tells your story.',
  },
  {
    id: '4',
    name: 'Spirit Guide Sam',
    title: 'Psychic Medium',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 5632,
    readingsCount: 7800,
    yearStarted: 2019,
    status: 'online',
    pricePerMinute: 5.99,
    discountedPrice: 2.99,
    freeMinutes: 3,
    specialties: ['Medium', 'Spirit Communication', 'Healing'],
    description: 'Connect with departed loved ones and receive messages from beyond the veil.',
    isTopRated: true,
  },
  {
    id: '5',
    name: 'Oracle Maya',
    title: 'Dream Interpreter',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 3421,
    readingsCount: 4500,
    yearStarted: 2020,
    status: 'offline',
    pricePerMinute: 2.49,
    specialties: ['Dreams', 'Symbolism', 'Subconscious'],
    description: 'Unlock the secrets of your subconscious. Your dreams hold the answers you seek.',
    isNew: true,
  },
  {
    id: '6',
    name: 'Crystal Claire',
    title: 'Energy Healer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 6789,
    readingsCount: 8900,
    yearStarted: 2017,
    status: 'online',
    pricePerMinute: 3.49,
    discountedPrice: 1.99,
    freeMinutes: 3,
    specialties: ['Crystal Healing', 'Chakra', 'Energy'],
    description: 'Restore balance and harmony through crystal energy and chakra alignment.',
  },
  {
    id: '7',
    name: 'Sage Alexander',
    title: 'Career & Finance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 4521,
    readingsCount: 5600,
    yearStarted: 2016,
    status: 'online',
    pricePerMinute: 4.49,
    discountedPrice: 2.49,
    specialties: ['Career', 'Finance', 'Business'],
    description: 'Navigate your professional path with clarity. Success is written in the stars.',
  },
  {
    id: '8',
    name: 'Starlight Sophia',
    title: 'Clairvoyant',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
    rating: 5.0,
    reviewCount: 12345,
    readingsCount: 15000,
    yearStarted: 2014,
    status: 'busy',
    pricePerMinute: 5.99,
    specialties: ['Clairvoyant', 'Future', 'Destiny'],
    description: 'See beyond the veil of time. Your future awaits revelation.',
    isTopRated: true,
  },
];

export const getOnlineAdvisors = () => advisors.filter(a => a.status === 'online');
export const getTopRatedAdvisors = () => advisors.filter(a => a.isTopRated);
export const getNewAdvisors = () => advisors.filter(a => a.isNew);
