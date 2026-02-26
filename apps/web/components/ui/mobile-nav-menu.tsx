'use client';

import { LinkProps, NavbarProps } from '@/lib/interface';

import { scrollToSection } from '@/lib/scroll';
import { Logo } from '@riven/ui/logo';
import { Github, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { Dispatch, FC, useState } from 'react';
import { Button } from './button';
import { CtaButton } from './cta-button';
import { ThemeToggle } from './theme-toggle';

interface MobileNavbarExtendedProps extends NavbarProps {
  open?: boolean;
  setOpen?: Dispatch<React.SetStateAction<boolean>>;
  showTrigger?: boolean;
}

export const MobileNavbar: FC<MobileNavbarExtendedProps> = ({
  links,
  className,
  open: externalOpen,
  setOpen: externalSetOpen,
  showTrigger = true,
}) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalSetOpen !== undefined ? externalSetOpen : setInternalOpen;

  return (
    <>
      <AnimatePresence>
        {isOpen ? <LinkSection links={links} toggle={setIsOpen} className={className} /> : null}
      </AnimatePresence>
    </>
  );
};

const mobileLinkVars = {
  initial: {
    translateX: '-100%',
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: [0.37, 0, 0.63, 1] as const,
    },
  },
  open: {
    opacity: 1,
    translateX: '0%',
    y: 0,
    transition: {
      ease: [0, 0.55, 0.45, 1] as const,
      duration: 0.35,
    },
  },
};

const menuVars = {
  initial: {
    opacity: 0,
    scaleY: 0.75,
  },
  animate: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.25,
      ease: [0.12, 0, 0.39, 0] as const,
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.75,
    transition: {
      delay: 0.5,
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};
const containerVars = {
  initial: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.04,
      staggerDirection: 1,
    },
  },
};

interface NavbarMenuProps extends NavbarProps {
  toggle: Dispatch<React.SetStateAction<boolean>>;
}

const LinkSection: FC<NavbarMenuProps> = ({ links, toggle }) => {
  const pathName = usePathname();

  return (
    <motion.div
      onClick={() => {
        toggle(false);
      }}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          delay: 1,
        },
      }}
      className="fixed inset-0 z-[100] h-screen w-screen bg-neutral-950/90"
    >
      <motion.aside
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-0 left-0 z-[99] h-screen w-full origin-top border-t-2 bg-background md:hidden"
        variants={menuVars}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex h-[6rem] w-full items-center justify-between p-4">
          <Link href={'/'} onClick={() => toggle(false)} className="flex items-center gap-2 px-2">
            <Logo size={32} />
            <div className="mt-1 font-serif text-2xl font-bold text-logo-primary">Riven</div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="https://github.com/rivenmedia/riven"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="size-5" />
            </Link>
            <ThemeToggle />
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={() => toggle(false)}
              className="size-12"
            >
              <X className="size-8" />
            </Button>
          </div>
        </div>
        <motion.div
          variants={containerVars}
          initial="initial"
          animate="open"
          exit="initial"
          className="group my-36 flex flex-col gap-4 px-12 text-center"
        >
          {links.map((link, index) => {
            return (
              <MobileNavLink
                toggle={toggle}
                key={`mobile-link-${index}`}
                label={link.label}
                href={link.href}
                active={false}
                external={link.external}
                shouldCloseOnClick={link.shouldCloseOnClick}
              />
            );
          })}
        </motion.div>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
            transition: {
              delay: 0.4,
            },
          }}
          exit={{
            opacity: 0,
            transition: {},
          }}
          className="flex h-auto w-full grow px-12"
        >
          <Link
            href="/#waitlist"
            onClick={(e) => {
              e.preventDefault();
              toggle(false);
              scrollToSection('waitlist');
            }}
          >
            <CtaButton size="sm">Join the waitlist</CtaButton>
          </Link>
        </motion.div>
      </motion.aside>
    </motion.div>
  );
};

interface NavbarItemProps extends LinkProps {
  toggle: Dispatch<React.SetStateAction<boolean>>;
  active: boolean;
}

const MobileNavLink: FC<NavbarItemProps> = ({
  label,
  href,
  toggle,
  shouldCloseOnClick = true,
  external = false,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const hash = href.includes('#') ? href.split('#')[1] : null;
    if (hash) {
      e.preventDefault();
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      window.history.replaceState(null, '', `#${hash}`);
      if (shouldCloseOnClick) {
        toggle(false);
      }
    } else {
      if (shouldCloseOnClick) {
        toggle(false);
      }
    }
  };

  return (
    <motion.div
      variants={mobileLinkVars}
      className="text-secondary-header pointer-events-auto text-3xl font-semibold uppercase group-hover:text-foreground/40 hover:group-hover:text-secondary-foreground"
    >
      <Link href={href} onClick={handleClick} target={external ? '_blank' : '_self'}>
        <div className="flex w-fit items-center space-x-3 py-1 transition-colors">{label}</div>
      </Link>
    </motion.div>
  );
};
