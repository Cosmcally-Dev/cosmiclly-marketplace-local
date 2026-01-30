import { Link } from 'react-router-dom';
import { Sparkles, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const footerLinks = {
  services: [
    { label: 'Psychic Readings', href: '/advisors?category=intuitive-readings' },
    { label: 'Tarot Readings', href: '/advisors?category=tarot' },
    { label: 'Astrology', href: '/advisors?category=astrology' },
    { label: 'Love & Relationships', href: '/advisors?category=love' },
    { label: 'Career Guidance', href: '/advisors?category=career' },
  ],
  explore: [
    { label: 'Daily Horoscope', href: '/horoscope' },
    { label: 'Articles & Blog', href: '/articles' },
    { label: 'Find an Advisor', href: '/advisors' },
    { label: 'Daily Oracle', href: '/daily-oracle' },
  ],
  support: [
    { label: 'Help Center', href: '/support' },
    { label: 'Contact Us', href: '/support#contact' },
    { label: 'How We Verify Advisors', href: '/support#verification' },
    { label: 'Become an Advisor', href: '/#apply' },
  ],
  about: [
    { label: 'About Us', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
              <span className="font-heading text-lg font-semibold text-gradient">Mystica</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-5">
              Connect with gifted psychic advisors for guidance on love, career, and life.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Explore</h4>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">About</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs text-center md:text-left">
              © {new Date().getFullYear()} Mystica. All rights reserved. For entertainment purposes only.
            </p>
            <p className="text-muted-foreground text-xs text-center">
              18+ only. Readings are for guidance and should not replace professional advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
