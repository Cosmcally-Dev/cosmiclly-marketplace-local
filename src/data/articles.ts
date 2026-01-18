import { Heart, Smile, Layers, Eye, Moon, Stars, BookHeart, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Article {
  id: string;
  title: string;
  image: string;
  category: string;
  slug: string;
}

export interface ArticleCategory {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  image: string;
  articles: Article[];
}

export const articleCategories: ArticleCategory[] = [
  {
    slug: 'love-relationships',
    label: 'Love & Relationships',
    description: 'Articles from top love advisors about all of relationships ups and downs',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop',
    articles: [
      { id: '1', title: '7 Signs to Leave a Relationship', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=280&fit=crop', category: 'love-relationships', slug: 'signs-to-leave-relationship' },
      { id: '2', title: '5 Ways to Save Your Relationship', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=280&fit=crop', category: 'love-relationships', slug: 'ways-to-save-relationship' },
      { id: '3', title: 'How to Find Your Soulmate', image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=280&fit=crop', category: 'love-relationships', slug: 'find-your-soulmate' },
      { id: '4', title: 'Recognizing Toxic Relationships', image: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=400&h=280&fit=crop', category: 'love-relationships', slug: 'toxic-relationships' },
      { id: '5', title: 'Communication in Love', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=280&fit=crop', category: 'love-relationships', slug: 'communication-in-love' },
      { id: '6', title: 'Building Trust After Betrayal', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=280&fit=crop', category: 'love-relationships', slug: 'building-trust' },
    ],
  },
  {
    slug: 'finding-happiness',
    label: 'Finding Happiness',
    description: 'Spiritual growth articles to help you find true peace and happiness in life',
    icon: Smile,
    color: 'from-amber-500 to-orange-600',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop',
    articles: [
      { id: '7', title: 'How To Develop Spiritual Gifts', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop', category: 'finding-happiness', slug: 'develop-spiritual-gifts' },
      { id: '8', title: 'How to Become a Spiritual Person', image: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=280&fit=crop', category: 'finding-happiness', slug: 'become-spiritual-person' },
      { id: '9', title: 'How to Be Spiritually Healthy', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=280&fit=crop', category: 'finding-happiness', slug: 'spiritually-healthy' },
      { id: '10', title: '4 Stages of Optimistic Living', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=280&fit=crop', category: 'finding-happiness', slug: 'optimistic-living' },
      { id: '11', title: 'How to Stay Positive', image: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=400&h=280&fit=crop', category: 'finding-happiness', slug: 'stay-positive' },
      { id: '12', title: 'How to Handle Stress', image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=400&h=280&fit=crop', category: 'finding-happiness', slug: 'handle-stress' },
    ],
  },
  {
    slug: 'tarot-guide',
    label: 'Tarot Guide',
    description: 'Learn how to read tarot cards and understand their deep spiritual meanings',
    icon: Layers,
    color: 'from-violet-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1591993704685-d1c7a16d1c36?w=400&h=300&fit=crop',
    articles: [
      { id: '13', title: 'Beginner\'s Guide to Tarot', image: 'https://images.unsplash.com/photo-1633513093305-1f7eb2fce2eb?w=400&h=280&fit=crop', category: 'tarot-guide', slug: 'beginners-guide-tarot' },
      { id: '14', title: 'Major Arcana Meanings', image: 'https://images.unsplash.com/photo-1574169207511-e21a21c8075a?w=400&h=280&fit=crop', category: 'tarot-guide', slug: 'major-arcana-meanings' },
      { id: '15', title: 'Minor Arcana Explained', image: 'https://images.unsplash.com/photo-1601065638996-9f25a25e4695?w=400&h=280&fit=crop', category: 'tarot-guide', slug: 'minor-arcana-explained' },
      { id: '16', title: 'Celtic Cross Spread', image: 'https://images.unsplash.com/photo-1572816703439-d8b34c4dc93f?w=400&h=280&fit=crop', category: 'tarot-guide', slug: 'celtic-cross-spread' },
      { id: '17', title: 'Love Tarot Spreads', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop', category: 'tarot-guide', slug: 'love-tarot-spreads' },
      { id: '18', title: 'Daily Card Rituals', image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&h=280&fit=crop', category: 'tarot-guide', slug: 'daily-card-rituals' },
    ],
  },
  {
    slug: 'all-about-psychics',
    label: 'All About Psychics',
    description: 'Discover how psychic readings work and how to prepare for your session',
    icon: Eye,
    color: 'from-emerald-500 to-teal-600',
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=300&fit=crop',
    articles: [
      { id: '19', title: 'How Psychic Readings Work', image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&h=280&fit=crop', category: 'all-about-psychics', slug: 'how-psychic-readings-work' },
      { id: '20', title: 'Preparing for Your First Reading', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=280&fit=crop', category: 'all-about-psychics', slug: 'preparing-first-reading' },
      { id: '21', title: 'Types of Psychic Abilities', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop', category: 'all-about-psychics', slug: 'types-psychic-abilities' },
      { id: '22', title: 'What is Clairsentience?', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=280&fit=crop', category: 'all-about-psychics', slug: 'what-is-clairsentience' },
      { id: '23', title: 'Signs You Have Psychic Gifts', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=280&fit=crop', category: 'all-about-psychics', slug: 'signs-psychic-gifts' },
      { id: '24', title: 'Choosing the Right Psychic', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=280&fit=crop', category: 'all-about-psychics', slug: 'choosing-right-psychic' },
    ],
  },
  {
    slug: 'horoscopes',
    label: 'Horoscopes',
    description: 'Daily, weekly, and monthly horoscopes for all zodiac signs',
    icon: Moon,
    color: 'from-indigo-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=400&h=300&fit=crop',
    articles: [
      { id: '25', title: 'Understanding Your Moon Sign', image: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=400&h=280&fit=crop', category: 'horoscopes', slug: 'understanding-moon-sign' },
      { id: '26', title: 'Rising Signs Explained', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=280&fit=crop', category: 'horoscopes', slug: 'rising-signs-explained' },
      { id: '27', title: 'Mercury Retrograde Survival', image: 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=400&h=280&fit=crop', category: 'horoscopes', slug: 'mercury-retrograde-survival' },
      { id: '28', title: 'Your Birth Chart Decoded', image: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=400&h=280&fit=crop', category: 'horoscopes', slug: 'birth-chart-decoded' },
      { id: '29', title: 'Planetary Transits Guide', image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=400&h=280&fit=crop', category: 'horoscopes', slug: 'planetary-transits-guide' },
      { id: '30', title: 'Eclipse Season Meanings', image: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400&h=280&fit=crop', category: 'horoscopes', slug: 'eclipse-season-meanings' },
    ],
  },
  {
    slug: 'astrology',
    label: 'Astrology',
    description: 'Learn all about astrology and the zodiac signs with these helpful articles',
    icon: Stars,
    color: 'from-cyan-500 to-sky-600',
    image: 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=400&h=300&fit=crop',
    articles: [
      { id: '31', title: 'Aries Woman Traits', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=280&fit=crop', category: 'astrology', slug: 'aries-woman-traits' },
      { id: '32', title: 'Taurus Man Personality', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=280&fit=crop', category: 'astrology', slug: 'taurus-man-personality' },
      { id: '33', title: 'Gemini Compatibility', image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=280&fit=crop', category: 'astrology', slug: 'gemini-compatibility' },
      { id: '34', title: 'Cancer Love Horoscope', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=280&fit=crop', category: 'astrology', slug: 'cancer-love-horoscope' },
      { id: '35', title: 'Leo Career Success', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=280&fit=crop', category: 'astrology', slug: 'leo-career-success' },
      { id: '36', title: 'Chinese Zodiac Guide', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop', category: 'astrology', slug: 'chinese-zodiac-guide' },
    ],
  },
  {
    slug: 'stories',
    label: 'Stories',
    description: 'Real stories and experiences from our community of seekers and advisors',
    icon: BookHeart,
    color: 'from-fuchsia-500 to-pink-600',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=300&fit=crop',
    articles: [
      { id: '37', title: 'My First Psychic Reading', image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&h=280&fit=crop', category: 'stories', slug: 'first-psychic-reading' },
      { id: '38', title: 'How Tarot Changed My Life', image: 'https://images.unsplash.com/photo-1633513093305-1f7eb2fce2eb?w=400&h=280&fit=crop', category: 'stories', slug: 'tarot-changed-my-life' },
      { id: '39', title: 'Finding Love Through Guidance', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=280&fit=crop', category: 'stories', slug: 'finding-love-guidance' },
      { id: '40', title: 'My Spiritual Awakening', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop', category: 'stories', slug: 'spiritual-awakening' },
      { id: '41', title: 'Dreams That Came True', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=280&fit=crop', category: 'stories', slug: 'dreams-came-true' },
      { id: '42', title: 'Connecting with Lost Loved Ones', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=280&fit=crop', category: 'stories', slug: 'connecting-lost-loved-ones' },
    ],
  },
  {
    slug: 'more-topics',
    label: 'More Topics',
    description: 'Explore a variety of spiritual and metaphysical topics beyond the basics',
    icon: Compass,
    color: 'from-slate-500 to-gray-600',
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=300&fit=crop',
    articles: [
      { id: '43', title: 'Crystal Healing Guide', image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&h=280&fit=crop', category: 'more-topics', slug: 'crystal-healing-guide' },
      { id: '44', title: 'Numerology Basics', image: 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=400&h=280&fit=crop', category: 'more-topics', slug: 'numerology-basics' },
      { id: '45', title: 'Meditation for Beginners', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=280&fit=crop', category: 'more-topics', slug: 'meditation-beginners' },
      { id: '46', title: 'Understanding Chakras', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=280&fit=crop', category: 'more-topics', slug: 'understanding-chakras' },
      { id: '47', title: 'Aura Reading Explained', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=280&fit=crop', category: 'more-topics', slug: 'aura-reading-explained' },
      { id: '48', title: 'Dream Interpretation', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=280&fit=crop', category: 'more-topics', slug: 'dream-interpretation' },
    ],
  },
];

export const getAllArticles = (): Article[] => {
  return articleCategories.flatMap(cat => cat.articles);
};

export const getArticlesByCategory = (slug: string): Article[] => {
  const category = articleCategories.find(cat => cat.slug === slug);
  return category?.articles || [];
};

export const getCategoryBySlug = (slug: string): ArticleCategory | undefined => {
  return articleCategories.find(cat => cat.slug === slug);
};
