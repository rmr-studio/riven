'use client';

import { NAV_LINKS } from '@/lib/navigation';
import { scrollToSection } from '@/lib/scroll';
import { Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@riven/ui/logo';

const footerLinks = {
  product: NAV_LINKS,
  legal: [{ label: 'Privacy Policy', href: '/privacy' }],
};

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/riven.app',
    icon: Instagram,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/getriven',
    icon: Linkedin,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background px-4 pt-14 pb-10 md:px-8 md:pt-20 md:pb-14 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Top: Logo/tagline + link columns */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={64} />
              <span className="mt-2 font-serif text-5xl font-bold tracking-tight text-logo-primary">
                Riven
              </span>
            </Link>
            <div className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              <p>Cross Domain Intelligence.</p>
              <p>One Connected Business.</p>
            </div>
          </div>

          <div className="flex gap-16 md:gap-20">
            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-sm font-semibold tracking-wide text-foreground">
                Product
              </h3>
              <ul className="flex flex-col gap-2.5">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        const hash = link.href.split('#')[1];
                        if (hash) {
                          e.preventDefault();
                          scrollToSection(hash, link.href);
                        }
                      }}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-sm font-semibold tracking-wide text-foreground">
                Legal
              </h3>
              <ul className="flex flex-col gap-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="mt-14 grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
          {socialLinks.map((social, i) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-6 py-5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground ${
                i < socialLinks.length - 1 ? 'border-b border-border sm:border-r sm:border-b-0' : ''
              }`}
            >
              <social.icon className="size-5" />
              <span className="text-sm font-medium">{social.label}</span>
            </a>
          ))}
        </div>

        {/* Bottom: Copyright + email */}
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Riven. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
