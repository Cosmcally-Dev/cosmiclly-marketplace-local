export interface Testimonial {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
  advisor: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Sarah M.',
    location: 'Los Angeles, CA',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Psychic Luna was absolutely incredible! She knew things about my relationship that I never told anyone. Her guidance helped me reconnect with my partner.',
    advisor: 'Psychic Luna',
  },
  {
    name: 'Michael T.',
    location: 'New York, NY',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    rating: 5,
    text: 'I was skeptical at first, but Master Chen\'s career reading was spot-on. He predicted my promotion three months before it happened!',
    advisor: 'Master Chen',
  },
  {
    name: 'Emily R.',
    location: 'Chicago, IL',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Connecting with my grandmother through Spirit Guide Sam brought me so much peace. He described her perfectly without me saying a word.',
    advisor: 'Spirit Guide Sam',
  },
];
