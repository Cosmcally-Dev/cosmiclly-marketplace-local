import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { 
  Search, 
  MessageSquarePlus, 
  Users, 
  BookOpen, 
  HelpCircle, 
  ChevronRight,
  Mail,
  Phone,
  Clock,
  FileText,
  CreditCard,
  Shield,
  User,
  Settings,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const supportCategories = [
  {
    id: 'how-to',
    icon: BookOpen,
    title: 'How To',
    description: 'Learn how to perform several basic actions on our platform',
    color: 'from-blue-500 to-cyan-600',
    articles: [
      'How to create an account',
      'How to start a reading session',
      'How to add credits to your account',
      'How to leave a review for an advisor',
      'How to manage your notifications',
      'How to update your profile settings',
    ],
  },
  {
    id: 'general-info',
    icon: HelpCircle,
    title: 'General Information & Questions',
    description: 'Find answers to common questions about our services',
    color: 'from-purple-500 to-violet-600',
    articles: [
      'What is Mystica and how does it work?',
      'What types of readings are available?',
      'How are advisors verified?',
      'What is your privacy policy?',
      'How does billing work?',
      'What payment methods are accepted?',
    ],
  },
];

const quickActions = [
  {
    icon: MessageSquarePlus,
    title: 'Create a Ticket',
    description: 'Contact our customer service team when you need help or have feedback',
    color: 'from-emerald-500 to-teal-600',
    action: 'Submit Request',
  },
  {
    icon: Users,
    title: 'Advisor Community',
    description: 'Resources and support exclusively for Mystica advisors',
    color: 'from-amber-500 to-orange-600',
    action: 'Advisor Portal',
  },
];

const faqItems = [
  {
    question: 'How do I get started with my first reading?',
    answer: 'Getting started is easy! Simply browse our advisors, choose one that resonates with you, and click "Start Chat" or "Call Now" to begin your session. New users receive bonus credits to try our services.',
  },
  {
    question: 'How are your psychic advisors selected?',
    answer: 'All our advisors go through a rigorous screening process that includes testing their abilities, background checks, and ongoing quality monitoring. Only the most gifted and ethical advisors are accepted onto our platform.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and various digital payment methods. All transactions are secured with bank-level encryption.',
  },
  {
    question: 'Can I get a refund if I\'m not satisfied?',
    answer: 'Yes! We offer a satisfaction guarantee for new users. If you\'re not happy with your first reading, contact our support team within 24 hours and we\'ll review your case for a potential credit or refund.',
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach our support team by submitting a ticket through this page, emailing support@mystica.com, or using the live chat feature available in your account dashboard. We typically respond within 24 hours.',
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Absolutely. We use industry-standard encryption to protect your data. Your readings are confidential, and we never share your personal information with third parties without your consent.',
  },
];

const helpTopics = [
  { icon: User, label: 'Account Settings', href: '/settings' },
  { icon: CreditCard, label: 'Billing & Payments', href: '/add-credit' },
  { icon: FileText, label: 'Reading History', href: '/settings' },
  { icon: Shield, label: 'Privacy & Security', href: '#' },
  { icon: Settings, label: 'App Settings', href: '/settings' },
  { icon: Sparkles, label: 'Getting Started', href: '/' },
];

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section with Search */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                How can we <span className="text-gradient-gold">help you?</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Search our knowledge base or browse categories below
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-card border-border rounded-xl focus:border-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {quickActions.map((action) => (
                <div
                  key={action.title}
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                Browse by Category
              </h2>
              <p className="text-muted-foreground">
                Find answers organized by topic
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {supportCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Category Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-semibold text-foreground">
                          {category.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Articles List */}
                  <div className="p-4">
                    <ul className="space-y-1">
                      {category.articles.map((article, index) => (
                        <li key={index}>
                          <a
                            href="#"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/80 hover:bg-secondary hover:text-primary transition-colors group"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                            <span className="text-sm">{article}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Help Topics */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                Quick Help Topics
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {helpTopics.map((topic) => (
                <Link
                  key={topic.label}
                  to={topic.href}
                  className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <topic.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {topic.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12">
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

        {/* Contact CTA */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Didn't find what you were looking for?
                </h2>
                <p className="text-muted-foreground">
                  Our support team is here to help
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl bg-card border border-border">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    Email Us
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get a response within 24 hours
                  </p>
                  <a href="mailto:support@mystica.com" className="text-primary hover:underline text-sm">
                    support@mystica.com
                  </a>
                </div>

                <div className="text-center p-6 rounded-xl bg-card border border-border">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquarePlus className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    Live Chat
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Chat with our support team
                  </p>
                  <Button variant="outline" size="sm">
                    Start Chat
                  </Button>
                </div>

                <div className="text-center p-6 rounded-xl bg-card border border-border">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    Support Hours
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Monday - Friday
                  </p>
                  <p className="text-sm text-foreground">
                    9:00 AM - 6:00 PM EST
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
