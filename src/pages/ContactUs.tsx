import { useState } from 'react';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronDown,
  Mail,
  MessageCircle,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';

const faqs = [
  {
    q: 'How do I create an account?',
    a: 'Click "Sign Up" at the top of the page. You can register with your email address and a password. Once registered, you can browse advisors and purchase credits to start a session.',
  },
  {
    q: 'How do credits work?',
    a: 'Credits are the currency used on Cosmiclly. You purchase credits in advance, then they are deducted per minute during a live session with an advisor. Some advisors offer free introductory minutes for new clients.',
  },
  {
    q: 'What session types are available?',
    a: 'We offer three session types: live text chat, voice calls, and video calls. Each advisor sets their own rate per minute. You can also interact with an advisor\'s AI Digital Twin for text-based guidance when the advisor is offline.',
  },
  {
    q: 'Can I get a refund?',
    a: 'If you experience a technical issue during a session, please contact our support team. We review each case individually and can issue credit refunds or Stripe refunds when appropriate. Disputes can also be filed through your Activity page.',
  },
  {
    q: 'How are advisors verified?',
    a: 'Every advisor goes through a manual review process. Our team reviews their application, credentials, social presence, and professional background before approval. Learn more on our "How We Verify Advisors" page.',
  },
  {
    q: 'What if my advisor doesn\'t answer?',
    a: 'If an advisor doesn\'t accept your session within 60 seconds, the request is automatically cancelled and no credits are charged. You can try again later or choose another advisor who is currently online.',
  },
  {
    q: 'Is my session private?',
    a: 'Absolutely. All sessions are private between you and your advisor. Chat messages are encrypted in transit, and we do not share session content with third parties.',
  },
  {
    q: 'How do I become an advisor?',
    a: 'Visit our "Become an Advisor" page to learn about the opportunity and submit an application. Our team reviews applications within 24-48 hours.',
  },
];

const subjects = ['General Inquiry', 'Billing & Credits', 'Technical Issue', 'Report a Problem'] as const;

function isWithinSupportHours(): boolean {
  const now = new Date();
  // Convert to EST (UTC-5) — simplified; doesn't handle DST perfectly
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const est = new Date(utc - 5 * 3600000);
  const day = est.getDay(); // 0=Sun
  const hour = est.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

export default function ContactUs() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formName, setFormName] = useState(user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '');
  const [formEmail, setFormEmail] = useState(user?.email ?? '');
  const [formSubject, setFormSubject] = useState<string>(subjects[0]);
  const [formMessage, setFormMessage] = useState('');
  const [sending, setSending] = useState(false);

  const liveAvailable = isWithinSupportHours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formMessage) return;

    setSending(true);
    try {
      const { sendEmail } = await import('@/services/email');
      await sendEmail({
        toEmail: 'support@mystica.com',
        toName: 'Cosmiclly Support',
        emailType: 'contact_form',
        templateParams: {
          sender_name: formName || 'Anonymous',
          sender_email: formEmail,
          subject: formSubject,
          message: formMessage,
        },
      });
      toast({ title: 'Message Sent', description: 'We\'ll get back to you within 24 hours.' });
      setFormMessage('');
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send', description: 'Please try emailing us directly.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StickyHeader />
      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero */}
        <section className="text-center py-12 md:py-16 px-4">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            How Can We Help?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions or reach out to our support team directly.
          </p>
        </section>

        <div className="container mx-auto px-4 pb-16 max-w-4xl space-y-12">
          {/* FAQs */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/5 transition-colors"
                  >
                    <span className="font-medium text-foreground text-sm">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 ml-2 transition-transform ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                  <Input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Subject</label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Message *</label>
                <Textarea
                  required
                  rows={5}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                />
              </div>
              <Button type="submit" disabled={sending || !formEmail || !formMessage}>
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </section>

          {/* Email + Live Chat + Support Hours */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Email */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
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

            {/* Live Chat */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
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

            {/* Support Hours */}
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-1">Support Hours</h3>
              <p className="text-sm text-foreground">Monday - Friday</p>
              <p className="text-sm text-primary font-medium">9:00 AM - 6:00 PM EST</p>
              <p className="text-xs text-muted-foreground mt-1">Excluding US holidays</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
