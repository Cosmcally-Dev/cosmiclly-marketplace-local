import { Link } from 'react-router-dom';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/categories';
import {
  DollarSign,
  Globe,
  MessageSquare,
  Bot,
  Users,
  ShieldCheck,
  ClipboardList,
  Search,
  Rocket,
  ArrowRight,
} from 'lucide-react';

const benefits = [
  {
    icon: DollarSign,
    title: 'Set Your Own Rates',
    description: 'You decide your per-minute rate. Earn what your expertise is worth.',
  },
  {
    icon: Globe,
    title: 'Work From Anywhere',
    description: 'Flexible schedule. Connect with clients from the comfort of your home.',
  },
  {
    icon: MessageSquare,
    title: 'Multiple Session Types',
    description: 'Offer live chat, voice calls, and video calls — whatever suits your style.',
  },
  {
    icon: Bot,
    title: 'AI Digital Twin',
    description: 'Your AI clone can interact with clients when you\'re offline, earning you passive income.',
  },
  {
    icon: Users,
    title: 'Built-in Client Base',
    description: 'Tap into our growing community of seekers looking for guidance.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: 'Get paid reliably through Stripe Connect. No chasing invoices.',
  },
];

const steps = [
  {
    icon: ClipboardList,
    step: '1',
    title: 'Submit Your Application',
    description: 'Fill out a short form with your specialties, experience, and a bit about yourself.',
  },
  {
    icon: Search,
    step: '2',
    title: 'We Review Your Profile',
    description: 'Our team reviews every application within 24-48 hours. We verify your credentials and background.',
  },
  {
    icon: Rocket,
    step: '3',
    title: 'Set Up & Go Live',
    description: 'Complete your advisor profile through our guided wizard and start receiving session requests.',
  },
];

export default function BecomeAdvisor() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StickyHeader />
      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero */}
        <section className="text-center py-16 md:py-20 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Share Your Gift With the World
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
            Join Cosmiclly's community of trusted spiritual advisors. Connect with clients seeking
            guidance on love, career, life purpose, and more.
          </p>
          <Button asChild size="lg" className="text-base px-8">
            <Link to="/advisor-portal?apply=true">
              Apply Now <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </section>

        <div className="container mx-auto px-4 pb-16 max-w-5xl space-y-16">
          {/* Benefits */}
          <section>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
              Why Advisors Choose Cosmiclly
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="bg-card border border-border rounded-xl p-6">
                  <b.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-xs font-semibold text-primary mb-1">STEP {s.step}</div>
                  <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Specialties We're Looking For */}
          <section>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-2">
              Specialties We're Looking For
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto">
              We welcome advisors across all spiritual and metaphysical disciplines.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.map((c) => (
                <div
                  key={c.slug}
                  className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5"
                >
                  <c.icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">{c.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Earnings */}
          <section className="bg-card border border-border rounded-xl p-8 text-center">
            <DollarSign className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">
              Competitive Earnings
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You set your per-minute rate and earn a share of every session. Payments are processed
              securely through Stripe Connect and deposited directly to your bank account.
              With our AI Digital Twin feature, you can even earn while you sleep.
            </p>
          </section>

          {/* Trust */}
          <section className="text-center">
            <p className="text-muted-foreground mb-2">
              Want to know how we maintain quality?
            </p>
            <Link to="/how-we-verify" className="text-primary hover:underline font-medium">
              Learn How We Verify Advisors <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </section>

          {/* Bottom CTA */}
          <section className="text-center py-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
              Ready to Join?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your journey as a Cosmiclly advisor starts with a simple application.
            </p>
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/advisor-portal?apply=true">
                Apply Now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
