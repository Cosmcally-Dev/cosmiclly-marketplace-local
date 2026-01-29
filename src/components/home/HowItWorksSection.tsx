import { UserPlus, Search, MessageCircle, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Free Account',
    description: 'Sign up in seconds and get 3 free minutes with your first advisor.',
    color: 'from-violet-600 to-purple-500',
  },
  {
    icon: Search,
    title: 'Find Your Advisor',
    description: 'Browse our verified advisors by specialty, rating, and availability.',
    color: 'from-purple-500 to-cyan-500',
  },
  {
    icon: MessageCircle,
    title: 'Start Your Reading',
    description: 'Connect instantly via chat for personal guidance and insights.',
    color: 'from-cyan-500 to-teal-400',
  },
  {
    icon: Sparkles,
    title: 'Get Clarity',
    description: 'Receive the answers and guidance you need to move forward.',
    color: 'from-teal-400 to-cyan-400',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            How <span className="text-gradient">It Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Getting started is easy. Connect with a psychic advisor in just a few simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line (Desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
              )}

              {/* Step Number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>

              {/* Icon - 15% larger */}
              <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                <step.icon className="w-12 h-12 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg text-foreground mb-2" style={{ fontWeight: 600 }}>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
