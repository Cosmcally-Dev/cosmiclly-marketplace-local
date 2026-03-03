import { useState } from 'react';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  MessageCircle,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';

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
            Contact Us
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Send us a message and our support team will get back to you within 24 hours.
          </p>
        </section>

        <div className="container mx-auto px-4 pb-16 max-w-4xl space-y-12">
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
