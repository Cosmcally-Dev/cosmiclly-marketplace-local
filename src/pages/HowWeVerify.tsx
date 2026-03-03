import { Link } from 'react-router-dom';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ClipboardCheck,
  Globe,
  UserCheck,
  BarChart3,
  CheckCircle2,
  Lock,
  Scale,
  Eye,
  ArrowRight,
} from 'lucide-react';

const verificationSteps = [
  {
    icon: ClipboardCheck,
    title: 'Application Review',
    description:
      'Every application is reviewed individually by our team. We evaluate stated specialties, years of experience, and professional background to ensure genuine expertise.',
  },
  {
    icon: Globe,
    title: 'Social & Credential Check',
    description:
      'We verify the social media profiles, websites, and professional credentials provided by each applicant to confirm their identity and track record.',
  },
  {
    icon: UserCheck,
    title: 'Profile Curation',
    description:
      'Approved advisors complete a guided setup wizard. We review their profile for quality, professionalism, and accuracy before it goes live on the platform.',
  },
  {
    icon: BarChart3,
    title: 'Ongoing Quality Monitoring',
    description:
      'Client reviews and ratings are continuously monitored. Advisors who fall below our quality standards are reviewed and may have their access suspended.',
  },
];

const qualities = [
  'Genuine expertise in their stated specialties',
  'Professional and respectful demeanor',
  'Commitment to client wellbeing and ethical practice',
  'Relevant experience (professional or personal)',
  'Honest and transparent communication style',
];

const safetyFeatures = [
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'All transactions are processed through Stripe with bank-level encryption.',
  },
  {
    icon: Scale,
    title: 'Dispute Resolution',
    description: 'Our admin team mediates any disputes between clients and advisors fairly.',
  },
  {
    icon: Eye,
    title: 'Admin Oversight',
    description: 'Session reports, reviews, and user feedback are actively monitored by our team.',
  },
];

export default function HowWeVerify() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StickyHeader />
      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero */}
        <section className="text-center py-16 md:py-20 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Your Trust Matters
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            We're committed to maintaining a safe, high-quality platform. Every advisor on Cosmiclly
            goes through our verification process before they can connect with clients.
          </p>
        </section>

        <div className="container mx-auto px-4 pb-16 max-w-4xl space-y-16">
          {/* Verification Process */}
          <section>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-10">
              Our Verification Process
            </h2>
            <div className="space-y-8">
              {verificationSteps.map((step, i) => (
                <div key={step.title} className="flex gap-5">
                  {/* Timeline */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    {i < verificationSteps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-8">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What We Look For */}
          <section className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              What We Look For
            </h2>
            <ul className="space-y-3">
              {qualities.map((q) => (
                <li key={q} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Client Safety */}
          <section>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-8">
              Client Safety
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {safetyFeatures.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-xl p-6 text-center">
                  <f.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl">
            <h2 className="text-xl font-heading font-bold text-foreground mb-3">
              Interested in Becoming an Advisor?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              If you have a genuine gift and want to help others, we'd love to hear from you.
            </p>
            <Button asChild size="lg">
              <Link to="/become-advisor">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
