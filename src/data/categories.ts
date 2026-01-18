import { 
  Eye, Sun, Star, Sparkles, Moon, Hand, Heart, TrendingUp, Ghost, 
  Layers, Zap, Users, Palette, Clock, Compass, Target, HeartHandshake, 
  Lightbulb, Infinity 
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Category {
  slug: string;
  label: string;
  shortDescription: string;
  longDescription: string;
  icon: LucideIcon;
  color: string;
  specialtyMatch: string[];
}

export const categories: Category[] = [
  {
    slug: 'intuitive-readings',
    label: 'Intuitive Readings',
    shortDescription: 'Connect with your inner wisdom through psychic insights.',
    longDescription: 'Our gifted intuitive readers tap into their psychic abilities to provide you with profound insights and guidance. Whether you\'re facing life decisions, seeking clarity on relationships, or looking for direction in your career, our intuitive advisors connect with your energy to reveal hidden truths and illuminate your path forward. Experience the power of genuine psychic insight from readers who have helped thousands find their way.',
    icon: Eye,
    color: 'from-purple-500 to-purple-700',
    specialtyMatch: ['Intuitive Readings'],
  },
  {
    slug: 'astrology',
    label: 'Astrology Insights',
    shortDescription: 'Discover what the stars reveal about your life path.',
    longDescription: 'Unlock the secrets written in the stars with our expert astrologers. Your birth chart is a cosmic blueprint that reveals your personality traits, life purpose, relationship patterns, and timing for major life events. Our astrology advisors provide personalized readings based on planetary alignments, transits, and progressions to help you understand yourself deeply and navigate life\'s challenges with celestial wisdom. From natal charts to compatibility analysis, discover what the universe has in store for you.',
    icon: Sun,
    color: 'from-amber-500 to-orange-600',
    specialtyMatch: ['Astrology Insights'],
  },
  {
    slug: 'numerology',
    label: 'Numerology',
    shortDescription: 'Unlock the hidden meaning of numbers in your life.',
    longDescription: 'Numbers carry powerful vibrations that influence every aspect of your life. Our numerology experts decode your life path number, destiny number, soul urge, and personal year cycles to reveal your true potential and life purpose. Discover why certain patterns keep appearing in your life, understand your compatibility with others, and learn the optimal timing for important decisions. Numerology provides a mathematical framework to understand the universe\'s plan for your unique journey.',
    icon: Star,
    color: 'from-blue-500 to-indigo-600',
    specialtyMatch: ['Numerology'],
  },
  {
    slug: 'tarot',
    label: 'Tarot Guidance',
    shortDescription: 'Gain insights through ancient tarot wisdom.',
    longDescription: 'The Tarot has been a trusted source of wisdom and guidance for centuries. Our skilled tarot readers use their intuitive gifts combined with the rich symbolism of the cards to provide you with clarity and direction. Whether you have specific questions about love, career, finances, or simply seek general guidance, a tarot reading can reveal hidden influences, potential outcomes, and the best path forward. Each card tells a story, and together they paint a picture of your journey.',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    specialtyMatch: ['Tarot Guidance'],
  },
  {
    slug: 'dreams',
    label: 'Dream Analysis',
    shortDescription: 'Decode the messages in your dreams.',
    longDescription: 'Your dreams are a window into your subconscious mind, filled with symbols, messages, and guidance from your higher self. Our dream interpretation specialists help you understand the deeper meaning behind your dreams, from recurring nightmares to prophetic visions. Dreams can reveal unresolved emotions, provide solutions to waking-life problems, and even offer glimpses into the future. Learn to harness the wisdom of your sleeping mind and transform confusing dream imagery into actionable insights.',
    icon: Moon,
    color: 'from-indigo-500 to-purple-600',
    specialtyMatch: ['Dream Analysis'],
  },
  {
    slug: 'palm',
    label: 'Palm Reading',
    shortDescription: 'Your destiny is written in your hands.',
    longDescription: 'Palmistry is an ancient art that reveals your character, talents, and life path through the lines, mounts, and shapes of your hands. Our experienced palm readers can identify your natural gifts, relationship patterns, health indicators, and life milestones encoded in your palms. Unlike other forms of divination, palmistry provides insights that are literally at your fingertips. Discover what your heart line says about your love life, what your head line reveals about your thinking style, and what your life line indicates about your vitality and life journey.',
    icon: Hand,
    color: 'from-emerald-500 to-teal-600',
    specialtyMatch: ['Palm Reading'],
  },
  {
    slug: 'love',
    label: 'Love Advice',
    shortDescription: 'Find guidance on matters of the heart.',
    longDescription: 'Love is the most profound human experience, yet it can also be the most confusing. Our love psychics specialize in matters of the heart, helping you navigate the complexities of romantic relationships. Whether you\'re searching for your soulmate, healing from heartbreak, trying to understand your partner better, or wondering if a relationship has long-term potential, our advisors provide compassionate, insightful guidance. Discover what\'s blocking love in your life, understand your relationship patterns, and learn how to attract and maintain healthy, fulfilling partnerships.',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    specialtyMatch: ['Love Advice'],
  },
  {
    slug: 'future',
    label: 'Future Predictions',
    shortDescription: 'Glimpse into what lies ahead.',
    longDescription: 'Would you like to know what the future holds? Our psychic advisors with precognitive abilities can provide glimpses into upcoming events, opportunities, and challenges in your life. While the future is not set in stone, understanding potential outcomes empowers you to make better decisions today. Our future-focused readers can help you prepare for what\'s coming, identify the best timing for major life moves, and understand the likely consequences of different choices. Gain the foresight you need to navigate life with confidence.',
    icon: Clock,
    color: 'from-cyan-500 to-blue-600',
    specialtyMatch: ['Future Predictions'],
  },
  {
    slug: 'career',
    label: 'Career Guidance',
    shortDescription: 'Navigate your professional path with clarity.',
    longDescription: 'Your career is more than just a job—it\'s a major part of your life journey. Our career-focused psychic advisors help you gain clarity on your professional path, whether you\'re considering a job change, starting a business, dealing with workplace challenges, or trying to discover your true calling. Through intuitive insights, we can reveal hidden opportunities, identify obstacles to your success, understand your unique talents, and guide you toward a career that aligns with your soul\'s purpose. Make confident professional decisions backed by spiritual wisdom.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    specialtyMatch: ['Career Guidance'],
  },
  {
    slug: 'mediums',
    label: 'Psychic Mediumship',
    shortDescription: 'Connect with loved ones who have passed.',
    longDescription: 'The bonds of love transcend physical death. Our gifted psychic mediums serve as bridges between the physical and spiritual realms, allowing you to receive messages from deceased loved ones. Whether you seek closure, comfort, or simply want to know that your loved ones are at peace, a mediumship reading can provide profound healing. Our mediums receive information through various means—seeing, hearing, or sensing spirits—to deliver messages of love, guidance, and reassurance from those who have crossed over.',
    icon: Ghost,
    color: 'from-slate-500 to-slate-700',
    specialtyMatch: ['Psychic Mediumship'],
  },
  {
    slug: 'energy',
    label: 'Energy Readings',
    shortDescription: 'Understand and balance your life force.',
    longDescription: 'Everything in the universe is made of energy, including you. Our energy readers can sense, interpret, and help you understand your energetic vibrations and how they affect every area of your life. Discover energetic blockages that may be causing problems in your health, relationships, or finances. Learn about the energy exchanges happening in your relationships and how to protect yourself from negative influences. Our advisors can help you raise your vibration, clear stagnant energy, and align with the abundant, positive energy of the universe.',
    icon: Zap,
    color: 'from-yellow-500 to-amber-600',
    specialtyMatch: ['Energy Readings'],
  },
  {
    slug: 'compatibility',
    label: 'Compatibility',
    shortDescription: 'Discover your relationship compatibility.',
    longDescription: 'Understanding compatibility goes beyond sun signs and surface-level attraction. Our compatibility specialists analyze the deeper energetic, astrological, and spiritual connections between you and your partner, potential love interest, family member, or business associate. Discover why certain relationships feel effortless while others are challenging, understand your relationship dynamics on a soul level, and learn how to navigate differences while strengthening your bond. Whether you\'re dating, married, or considering a partnership, gain insights that can transform your connections.',
    icon: Users,
    color: 'from-rose-500 to-pink-600',
    specialtyMatch: ['Compatibility'],
  },
  {
    slug: 'aura',
    label: 'Aura Reading',
    shortDescription: 'Explore the colors of your energy field.',
    longDescription: 'Your aura is the electromagnetic energy field that surrounds your body, reflecting your emotional, mental, and spiritual state through colors and patterns. Our aura readers can perceive these subtle energies and interpret what they reveal about you. Discover your dominant aura colors and what they say about your personality, identify areas of imbalance or blockage, understand how your energy affects others, and learn techniques to cleanse and strengthen your auric field. Aura readings provide unique insights into your overall well-being and spiritual development.',
    icon: Palette,
    color: 'from-fuchsia-500 to-purple-600',
    specialtyMatch: ['Aura Reading'],
  },
  {
    slug: 'past-lives',
    label: 'Past Lives',
    shortDescription: 'Explore your soul\'s journey through lifetimes.',
    longDescription: 'Your soul has lived many lives, and the experiences from those lifetimes continue to influence you today. Our past life specialists can help you access memories and insights from your previous incarnations, revealing the origins of current fears, talents, relationships, and life patterns. Understanding your past lives can bring profound healing, explain inexplicable attractions or aversions, and help you fulfill karmic lessons. Whether you\'re curious about who you\'ve been or seeking to heal deep-seated issues, past life exploration offers transformative insights.',
    icon: Infinity,
    color: 'from-teal-500 to-cyan-600',
    specialtyMatch: ['Past Lives'],
  },
  {
    slug: 'spiritual-coaching',
    label: 'Spiritual Coaching',
    shortDescription: 'Deepen your spiritual connection and growth.',
    longDescription: 'Spiritual growth is a lifelong journey, and having a guide can make all the difference. Our spiritual coaches combine psychic abilities with coaching techniques to help you deepen your connection to your higher self, the divine, and the universe. Whether you\'re just beginning your spiritual awakening or looking to advance your practice, our advisors provide personalized guidance on meditation, energy work, developing intuition, and living in alignment with your soul\'s purpose. Transform your spiritual aspirations into daily reality.',
    icon: Compass,
    color: 'from-indigo-500 to-blue-600',
    specialtyMatch: ['Spiritual Coaching'],
  },
  {
    slug: 'manifestation',
    label: 'Manifestation',
    shortDescription: 'Learn to create the life you desire.',
    longDescription: 'You have the power to create your reality through the law of attraction and conscious manifestation. Our manifestation experts help you understand and harness these universal principles to attract love, abundance, success, and anything else your heart desires. Learn why past manifestation attempts may have failed, identify and clear limiting beliefs blocking your desires, and develop a personalized manifestation practice that works. From vision boards to energy alignment, discover the techniques that will help you transform your dreams into reality.',
    icon: Target,
    color: 'from-orange-500 to-red-600',
    specialtyMatch: ['Manifestation'],
  },
  {
    slug: 'emotional-healing',
    label: 'Emotional Healing',
    shortDescription: 'Heal wounds and find inner peace.',
    longDescription: 'Emotional wounds, whether from childhood, past relationships, or traumatic experiences, can hold you back from living your fullest life. Our emotional healing specialists combine psychic insight with healing energy to help you identify, process, and release emotional pain. Whether you\'re dealing with grief, anxiety, depression, or patterns of self-sabotage, our advisors provide compassionate support and practical guidance. Learn to forgive yourself and others, release stored trauma from your energy body, and cultivate lasting emotional well-being.',
    icon: HeartHandshake,
    color: 'from-pink-400 to-rose-500',
    specialtyMatch: ['Emotional Healing'],
  },
  {
    slug: 'life-coaching',
    label: 'Life Coaching',
    shortDescription: 'Achieve your goals and live your best life.',
    longDescription: 'Ready to take your life to the next level? Our life coaches blend practical coaching strategies with intuitive guidance to help you identify your goals, overcome obstacles, and create actionable plans for success. Whether you\'re seeking better work-life balance, improved relationships, personal development, or a complete life transformation, our advisors provide the motivation, accountability, and insights you need. Discover your authentic self, break through limiting patterns, and design a life that truly fulfills you.',
    icon: Lightbulb,
    color: 'from-amber-400 to-yellow-500',
    specialtyMatch: ['Life Coaching'],
  },
  {
    slug: 'destiny',
    label: 'Destiny Insights',
    shortDescription: 'Understand your life purpose and soul path.',
    longDescription: 'You were born for a reason. Our destiny specialists help you understand your unique life purpose and the path your soul chose before entering this lifetime. Through psychic insight, astrology, numerology, or other divination methods, discover the themes, lessons, and missions that define your existence. Learn how to align your daily choices with your higher purpose, understand the significance of major life events, and find meaning in your journey. When you understand your destiny, every day becomes an opportunity for fulfillment.',
    icon: Layers,
    color: 'from-purple-500 to-indigo-600',
    specialtyMatch: ['Destiny Insights'],
  },
];

export const getCategoryBySlug = (slug: string) => categories.find(c => c.slug === slug);
export const getCategoryLabel = (slug: string) => getCategoryBySlug(slug)?.label || 'All Advisors';
