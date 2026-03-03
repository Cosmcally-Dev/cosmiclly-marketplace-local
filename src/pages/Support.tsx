import { Link } from 'react-router-dom';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Footer } from '@/components/layout/Footer';
import {
  HelpCircle,
  ChevronRight,
  MessageSquarePlus,
  Sparkles,
  UserPlus,
  Search,
  MousePointerClick,
  Headphones,
  Mail,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const quickActions = [
  {
    icon: MessageSquarePlus,
    title: 'Contact Support',
    description: 'Submit a request or send us a message through our contact form',
    color: 'from-emerald-500 to-teal-600',
    action: 'Contact Us',
    href: '/contact',
  },
  {
    icon: Sparkles,
    title: 'Become an Advisor',
    description: 'Join our community of gifted advisors and share your abilities',
    color: 'from-amber-500 to-orange-600',
    action: 'Learn More',
    href: '/become-advisor',
  },
];

const howItWorks = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up for free with your email or Google account, then add credits to get started.',
  },
  {
    step: 2,
    icon: Search,
    title: 'Browse Advisors',
    description: 'Explore our verified advisors, read reviews, and find one that resonates with you.',
  },
  {
    step: 3,
    icon: MousePointerClick,
    title: 'Start a Reading',
    description: 'Choose chat, voice, or video and connect instantly. Pay only for the time you use.',
  },
];

const faqItems = [
  {
    question: 'How do I create an account?',
    answer: 'Click "Sign Up" at the top of the page. You can register with your email address and a password. Once registered, you can browse advisors and purchase credits to start a session.',
  },
  {
    question: 'How do credits work?',
    answer: 'Credits are the currency used on Cosmiclly. You purchase credits in advance, then they are deducted per minute during a live session with an advisor. Some advisors offer free introductory minutes for new clients.',
  },
  {
    question: 'What session types are available?',
    answer: "We offer three session types: live text chat, voice calls, and video calls. Each advisor sets their own rate per minute. You can also interact with an advisor's AI Digital Twin for text-based guidance when the advisor is offline.",
  },
  {
    question: 'Can I get a refund?',
    answer: "If you experience a technical issue during a session, please contact our support team. We review each case individually and can issue credit refunds or Stripe refunds when appropriate. Disputes can also be filed through your Activity page.",
  },
  {
    question: 'How are advisors verified?',
    answer: 'Every advisor goes through a manual review process. Our team reviews their application, credentials, social presence, and professional background before approval. Learn more on our "How We Verify Advisors" page.',
  },
  {
    question: "What if my advisor doesn't answer?",
    answer: "If an advisor doesn't accept your session within 60 seconds, the request is automatically cancelled and no credits are charged. You can try again later or choose another advisor who is currently online.",
  },
  {
    question: 'Is my session private?',
    answer: 'Absolutely. All sessions are private between you and your advisor. Chat messages are encrypted in transit, and we do not share session content with third parties.',
  },
  {
    question: 'How do I become an advisor?',
    answer: 'Visit our "Become an Advisor" page to learn about the opportunity and submit an application. Our team reviews applications within 24-48 hours.',
  },
];

function isWithinSupportHours(): boolean {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const est = new Date(utc - 5 * 3600000);
  const day = est.getDay();
  const hour = est.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

const Support = () => {
  const liveAvailable = isWithinSupportHours();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StickyHeader />

      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
                Help <span className="text-gradient-gold">Center</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Find answers to common questions, learn how to get started, or reach out to our support team.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                        {action.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {action.description}
                      </p>
                      <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {action.action}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                How It Works
              </h2>
              <p className="text-muted-foreground">
                Get started with Cosmiclly in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {howItWorks.map((item) => (
                <div
                  key={item.step}
                  className="relative text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Quick answers to common questions
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
                  >
                    <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Support Contact Methods */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                Get In Touch
              </h2>
              <p className="text-muted-foreground">
                Multiple ways to reach our support team
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-lg transition-all">
                <Mail className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                <a
                  href="mailto:support@mystica.com"
                  className="text-primary hover:underline text-sm"
                >
                  support@mystica.com
                </a>
                <p className="text-xs text-muted-foreground mt-1">Typically responds within 24 hours</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-lg transition-all">
                <MessageCircle className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Live Chat</h3>
                <Button
                  size="sm"
                  disabled={!liveAvailable}
                  variant={liveAvailable ? 'default' : 'outline'}
                  className="mt-1"
                >
                  {liveAvailable ? 'Start Chat' : 'Unavailable'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {liveAvailable
                    ? 'Support agents are online now'
                    : 'Available Mon-Fri, 9AM-6PM EST'}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 hover:shadow-lg transition-all">
                <Clock className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Support Hours</h3>
                <p className="text-sm text-foreground">Monday - Friday</p>
                <p className="text-sm text-primary font-medium">9:00 AM - 6:00 PM EST</p>
                <p className="text-xs text-muted-foreground mt-1">Excluding US holidays</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <Headphones className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
              Still need help?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our support team is ready to assist you
            </p>
            <Link to="/contact">
              <Button size="lg">
                Contact Support
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
