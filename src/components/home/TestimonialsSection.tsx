import { Star, Quote } from 'lucide-react';

const testimonials = [
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

export const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-hero-gradient relative overflow-hidden">
      {/* Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-accent rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our <span className="text-gradient-gold">Clients Say</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real stories from people who found clarity and guidance through our advisors
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative bg-card/80 backdrop-blur-sm rounded-xl border border-border p-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                />
                <div>
                  <div className="font-medium text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                </div>
              </div>

              {/* Advisor Tag */}
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Reading with </span>
                <span className="text-xs text-primary font-medium">{testimonial.advisor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
