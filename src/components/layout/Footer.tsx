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
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">

          {/* Brand */}
          <div className="md:col-span-3">
            <Link to="/" className="flex items-center gap-0 mb-4">
              <img src="/cosmiclly-logo.png" alt="Cosmiclly" className="h-9 w-auto object-contain" />
              <span
                className="font-heading font-semibold text-gradient"
                style={{ marginLeft: "-1.1rem", fontSize: "clamp(1.125rem, 2vw, 1.2rem)", lineHeight: "1.2" }}
              >osmiclly</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Connect with gifted psychic advisors for guidance on love, career, and life.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="md:col-span-5">
            <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">Services</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
              {footerLinks.services.map((link) => (
                <Link key={link.label} to={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Explore, Support, About */}
          <div className="md:col-span-4 grid grid-cols-3 gap-6">
            {/* Explore */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">Explore</h4>
              <ul className="space-y-2.5">
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
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">Support</h4>
              <ul className="space-y-2.5">
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
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">About</h4>
              <ul className="space-y-2.5">
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
