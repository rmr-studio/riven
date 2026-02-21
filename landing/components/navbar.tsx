'use client';

import { Button } from '@/components/ui/button';
import { MobileNavbar } from '@/components/ui/mobile-nav-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ChevronRight, Github, Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HoverBorderGradient } from './ui/hover-border-gradient';
import { Logo } from './ui/logo';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'FAQs', href: '/#faqs' },
];

export function Navbar() {
  const [isInverted, setIsInverted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const check = () => {
      const sections = document.querySelectorAll<HTMLElement>('[data-navbar-inverse]');

      const navBottom = 72; // navbar height + top padding
      let inverted = false;
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top < navBottom && rect.bottom > 0) {
          inverted = true;
          break;
        }
      }
      setIsInverted(inverted);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(check);
    };

    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex items-center px-2 pt-4 md:px-4">
      <nav
        data-navbar=""
        {...(isInverted ? { 'data-inverted': '' } : {})}
        className="mx-auto flex h-12 w-auto grow items-center justify-between rounded-full border border-border/50 bg-background/60 shadow-sm shadow-primary/35 backdrop-blur-xl md:h-14 lg:max-w-[80dvw]"
      >
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center">
          <Link href="/" className="flex shrink-0 gap-1.5 px-3 md:gap-2 md:px-4">
            <Logo size={24} />
            <div className="mb-0.5 font-mono text-xs font-bold tracking-tight text-primary md:text-xl">
              riven
            </div>
          </Link>

          {/* Nav Links - desktop only */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: ThemeToggle + CTA + Mobile Menu */}
        <div className="flex items-center gap-1.5 px-2 md:gap-2 md:px-4">
          <Link
            href="https://github.com/rivenmedia/riven"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-muted-foreground transition-colors hover:text-foreground md:flex"
          >
            <Github className="size-5" />
          </Link>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <a href="/#contact">
            <HoverBorderGradient className="overflow-hidden bg-background p-0" as="div">
              <Button
                size={'sm'}
                className="h-7 cursor-pointer items-center gap-1 border-0 bg-muted/50 py-0.5 px-2.5 font-mono text-xs tracking-wide text-muted-foreground outline-0 hover:bg-muted hover:text-foreground md:h-8 md:gap-1.5 md:px-3 md:text-xs"
              >
                <span className="hidden sm:block">Join the waitlist</span>
                <span className="sm:hidden">Get Started</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 md:h-4 md:w-4" />
              </Button>
            </HoverBorderGradient>
          </a>

          <Button
            variant={'ghost'}
            size={'icon'}
            onClick={() => setMobileMenuOpen(true)}
            className="size-8 shrink-0 cursor-pointer md:hidden"
          >
            <Menu className="size-4 text-primary" />
          </Button>
        </div>
      </nav>

      <MobileNavbar
        links={navLinks}
        open={mobileMenuOpen}
        setOpen={setMobileMenuOpen}
        showTrigger={false}
      />
    </header>
  );
}
