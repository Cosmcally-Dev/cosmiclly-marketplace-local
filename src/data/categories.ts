import { 
  Eye, Sun, Star, Sparkles, Moon, Hand, Heart, TrendingUp, Ghost, 
  Layers, Zap, Users, Palette, Clock, Compass, Target, HeartHandshake, 
  Lightbulb, Infinity 
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Category {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  specialtyMatch: string[]; // Match these specialty values from advisors
}

export const categories: Category[] = [
  {
    slug: 'intuitive-readings',
    label: 'Intuitive Readings',
    description: 'Connect with your inner wisdom through psychic insights and intuitive guidance for clarity on life\'s questions.',
    icon: Eye,
    color: 'from-purple-500 to-purple-700',
    specialtyMatch: ['Intuitive Readings'],
  },
  {
    slug: 'astrology',
    label: 'Astrology Insights',
    description: 'Discover what the stars reveal about your personality, relationships, and life path through celestial wisdom.',
    icon: Sun,
    color: 'from-amber-500 to-orange-600',
    specialtyMatch: ['Astrology Insights'],
  },
  {
    slug: 'numerology',
    label: 'Numerology',
    description: 'Unlock the hidden meaning of numbers in your life to understand your destiny and life purpose.',
    icon: Star,
    color: 'from-blue-500 to-indigo-600',
    specialtyMatch: ['Numerology'],
  },
  {
    slug: 'tarot',
    label: 'Tarot Guidance',
    description: 'Gain profound insights through the ancient wisdom of tarot cards revealing past, present, and future.',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    specialtyMatch: ['Tarot Guidance'],
  },
  {
    slug: 'dreams',
    label: 'Dream Analysis',
    description: 'Decode the symbols and messages in your dreams to unlock your subconscious wisdom.',
    icon: Moon,
    color: 'from-indigo-500 to-purple-600',
    specialtyMatch: ['Dream Analysis'],
  },
  {
    slug: 'palm',
    label: 'Palm Reading',
    description: 'Discover your destiny through the ancient art of palmistry, reading the lines of your hands.',
    icon: Hand,
    color: 'from-emerald-500 to-teal-600',
    specialtyMatch: ['Palm Reading'],
  },
  {
    slug: 'love',
    label: 'Love Advice',
    description: 'Find guidance on matters of the heart, from attracting love to healing relationships.',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    specialtyMatch: ['Love Advice'],
  },
  {
    slug: 'future',
    label: 'Future Predictions',
    description: 'Glimpse into what lies ahead with psychic foresight to prepare for life\'s upcoming chapters.',
    icon: Clock,
    color: 'from-cyan-500 to-blue-600',
    specialtyMatch: ['Future Predictions'],
  },
  {
    slug: 'career',
    label: 'Career Guidance',
    description: 'Navigate your professional path with clarity, from job changes to business decisions.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    specialtyMatch: ['Career Guidance'],
  },
  {
    slug: 'mediums',
    label: 'Psychic Mediumship',
    description: 'Connect with loved ones who have passed and receive messages from the spirit world.',
    icon: Ghost,
    color: 'from-slate-500 to-slate-700',
    specialtyMatch: ['Psychic Mediumship'],
  },
  {
    slug: 'energy',
    label: 'Energy Readings',
    description: 'Understand your energetic vibrations and learn to balance and elevate your life force.',
    icon: Zap,
    color: 'from-yellow-500 to-amber-600',
    specialtyMatch: ['Energy Readings'],
  },
  {
    slug: 'compatibility',
    label: 'Compatibility',
    description: 'Discover your romantic and relationship compatibility with loved ones and potential partners.',
    icon: Users,
    color: 'from-rose-500 to-pink-600',
    specialtyMatch: ['Compatibility'],
  },
  {
    slug: 'aura',
    label: 'Aura Reading',
    description: 'Explore the colors and energies of your aura to understand your emotional and spiritual state.',
    icon: Palette,
    color: 'from-fuchsia-500 to-purple-600',
    specialtyMatch: ['Aura Reading'],
  },
  {
    slug: 'past-lives',
    label: 'Past Lives',
    description: 'Explore your soul\'s journey through previous lifetimes to heal karmic patterns.',
    icon: Infinity,
    color: 'from-teal-500 to-cyan-600',
    specialtyMatch: ['Past Lives'],
  },
  {
    slug: 'spiritual-coaching',
    label: 'Spiritual Coaching',
    description: 'Receive guidance on your spiritual journey and deepen your connection to higher wisdom.',
    icon: Compass,
    color: 'from-indigo-500 to-blue-600',
    specialtyMatch: ['Spiritual Coaching'],
  },
  {
    slug: 'manifestation',
    label: 'Manifestation',
    description: 'Learn to attract your desires and create the life you dream of through focused intention.',
    icon: Target,
    color: 'from-orange-500 to-red-600',
    specialtyMatch: ['Manifestation'],
  },
  {
    slug: 'emotional-healing',
    label: 'Emotional Healing',
    description: 'Heal emotional wounds, release past trauma, and find inner peace and balance.',
    icon: HeartHandshake,
    color: 'from-pink-400 to-rose-500',
    specialtyMatch: ['Emotional Healing'],
  },
  {
    slug: 'life-coaching',
    label: 'Life Coaching',
    description: 'Get practical guidance and support to achieve your goals and live your best life.',
    icon: Lightbulb,
    color: 'from-amber-400 to-yellow-500',
    specialtyMatch: ['Life Coaching'],
  },
  {
    slug: 'destiny',
    label: 'Destiny Insights',
    description: 'Understand your life purpose and the path your soul is meant to walk in this lifetime.',
    icon: Layers,
    color: 'from-purple-500 to-indigo-600',
    specialtyMatch: ['Destiny Insights'],
  },
];

export const getCategoryBySlug = (slug: string) => categories.find(c => c.slug === slug);
export const getCategoryLabel = (slug: string) => getCategoryBySlug(slug)?.label || 'All Advisors';
