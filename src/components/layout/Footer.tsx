import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { categories } from '@/data/categories';

const footerLinks = {
  services: categories.map(c => ({ label: c.label, href: `/advisors?category=${c.slug}` })),
  explore: [
    { label: 'Daily Horoscope', href: '/horoscope' },
    { label: 'Articles & Blog', href: '/articles' },
    { label: 'Find an Advisor', href: '/advisors' },
    { label: 'Daily Oracle', href: '/daily-oracle' },
  ],
  support: [
    { label: 'Help Center', href: '/support' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'How We Verify Advisors', href: '/how-we-verify' },
    { label: 'Become an Advisor', href: '/become-advisor' },
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-0 mb-4">
              <img src="/cosmiclly-logo.png" alt="Cosmiclly" className="h-9 w-auto object-contain" />
              <span className="font-heading text-lg font-semibold text-gradient -ml-2">osmiclly</span>
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
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-secondary hover:text-muted-foreground transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services — all specialties in 3 columns */}
          <div className="col-span-2">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Services</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
              {footerLinks.services.map((link) => (
                <Link key={link.label} to={link.href} className="text-muted-foreground hover:text-primary text-xs transition-colors whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
            </div>
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
              © {new Date().getFullYear()} Cosmiclly. All rights reserved. For entertainment purposes only.
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
