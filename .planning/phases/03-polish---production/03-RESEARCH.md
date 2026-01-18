# Phase 3: Polish + Production - Research

**Researched:** 2026-01-18
**Domain:** Responsive design, accessibility, production deployment
**Confidence:** HIGH

## Summary

Phase 3 focuses on making the landing page production-ready through responsive design implementation, branding elements (logo/wordmark), footer creation, and production deployment preparation. The research covers Tailwind CSS v4's mobile-first responsive system, Next.js 15+ Image component for logo optimization, WCAG 2.2 accessibility requirements (especially touch targets), and production deployment best practices.

**Key findings:**
- Tailwind CSS v4 uses CSS-first configuration with `@theme` directive and `--breakpoint-*` variables
- Mobile-first approach means unprefixed utilities target mobile, prefixed variants target breakpoints and up
- WCAG 2.5.8 requires 24×24 CSS pixel minimum touch targets (48×48 recommended for best practices)
- Next.js 16 introduced `preload` prop (replacing `priority`) for LCP optimization
- Next.js Metadata API provides comprehensive SEO and social sharing configuration

**Primary recommendation:** Implement responsive design mobile-first using Tailwind's unprefixed utilities for base styles, layer breakpoint-specific adjustments progressively, ensure all interactive elements meet 48×48px touch targets, and configure comprehensive metadata for production SEO.

## Standard Stack

The established libraries/tools for responsive design and production deployment in Next.js 15+:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | Mobile-first responsive design | Industry standard utility-first CSS framework with CSS-first config |
| Next.js Image | Built-in 15+ | Logo/image optimization | Automatic WebP/AVIF, lazy loading, prevents layout shift |
| Next.js Metadata API | Built-in 15+ | SEO & social sharing | Type-safe, server-only, automatic merging across layouts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @next/bundle-analyzer | Latest | Bundle size analysis | Pre-production optimization checks |
| eslint-plugin-jsx-a11y | Latest | Accessibility linting | Catch a11y issues during development |
| Lighthouse | Built-in Chrome | Core Web Vitals auditing | Pre-deployment performance validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind breakpoints | CSS media queries | Tailwind provides better consistency and DX |
| Next.js Image | Regular `<img>` | Lose automatic optimization, modern formats, lazy loading |
| Metadata API | next-seo library | Official API is type-safe, better integrated, fewer dependencies |

**Installation:**
```bash
# Bundle analyzer (optional, for production optimization)
npm install @next/bundle-analyzer

# A11y linting (optional, recommended)
npm install --save-dev eslint-plugin-jsx-a11y
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── layout.tsx           # Root metadata, global layout
├── page.tsx             # Landing page with all sections
├── opengraph-image.tsx  # Dynamic OG image generation (optional)
└── components/
    ├── ui/              # shadcn/ui components (already exists)
    ├── sections/        # Section components (already exists)
    └── Footer.tsx       # New footer component

public/
├── logo.svg             # Company logo/wordmark
└── favicon.ico          # Favicon

```

### Pattern 1: Mobile-First Responsive Implementation
**What:** Start with mobile styles (unprefixed), layer desktop adjustments with breakpoint prefixes
**When to use:** All responsive styling in this phase

**Example:**
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Mobile-first: base styles for mobile, then layer larger screens
<div className="
  grid grid-cols-1        /* Mobile: single column */
  gap-4                   /* Mobile: 1rem gap */
  px-4                    /* Mobile: 1rem padding */
  md:grid-cols-2          /* Tablet: 2 columns */
  md:gap-6                /* Tablet: 1.5rem gap */
  lg:grid-cols-3          /* Desktop: 3 columns */
  lg:gap-8                /* Desktop: 2rem gap */
  lg:px-8                 /* Desktop: 2rem padding */
">
  {/* Content */}
</div>

// Hero section responsive text
<h1 className="
  text-4xl                /* Mobile: 2.25rem */
  font-bold
  md:text-5xl             /* Tablet: 3rem */
  lg:text-6xl             /* Desktop: 3.75rem */
">
  Your Heading
</h1>
```

### Pattern 2: Touch-Friendly Interactive Elements
**What:** Ensure all buttons, links, and form inputs meet 48×48px minimum touch targets
**When to use:** All interactive elements (buttons, form inputs, links)

**Example:**
```tsx
// Source: WCAG 2.5.8, Apple HIG, Material Design guidelines
// Button with proper touch target
<button className="
  min-h-[48px]           /* Minimum 48px height */
  min-w-[48px]           /* Minimum 48px width for icon buttons */
  px-6 py-3              /* Comfortable padding for text buttons */
  text-base              /* 16px minimum for readability */
  rounded-md
  bg-primary
  text-primary-foreground
">
  Submit
</button>

// Form input with touch-friendly sizing
<input
  type="email"
  className="
    h-12                 /* 48px height */
    px-4                 /* Comfortable padding */
    text-base            /* 16px text prevents iOS zoom */
    rounded-md
    border
  "
/>
```

### Pattern 3: Next.js Image Component for Logo
**What:** Use Next.js Image component with proper sizing and optimization
**When to use:** Logo/wordmark, any images in footer

**Example:**
```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/image
import Image from 'next/image'

// Logo in header/footer (fixed size)
<Image
  src="/logo.svg"
  alt="Company name"
  width={160}
  height={40}
  className="h-10 w-auto"  // Responsive width, fixed height
/>

// If logo needs priority (above fold)
<Image
  src="/logo.svg"
  alt="Company name"
  width={160}
  height={40}
  preload={true}           // New in Next.js 16 (replaces priority)
/>
```

### Pattern 4: Metadata Configuration
**What:** Static metadata object in root layout for SEO and social sharing
**When to use:** Root layout for site-wide metadata

**Example:**
```tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://yoursite.com'),
  title: {
    default: 'Your Site Name',
    template: '%s | Your Site Name'
  },
  description: 'Your compelling site description',
  keywords: ['keyword1', 'keyword2'],

  openGraph: {
    title: 'Your Site Name',
    description: 'Your compelling site description',
    url: 'https://yoursite.com',
    siteName: 'Your Site Name',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Site preview'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Your Site Name',
    description: 'Your compelling site description',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
}
```

### Pattern 5: Footer Component Structure
**What:** Semantic footer with contact, copyright, and branding
**When to use:** Required FOOT-01, FOOT-02, FOOT-03

**Example:**
```tsx
// Source: Common footer patterns from React ecosystem
export function Footer() {
  return (
    <footer className="
      border-t
      bg-background
      px-4                    /* Mobile padding */
      py-8
      md:px-8                 /* Tablet padding */
      lg:px-12                /* Desktop padding */
    ">
      <div className="
        mx-auto
        max-w-7xl
        flex flex-col          /* Mobile: stack */
        gap-6
        md:flex-row            /* Desktop: horizontal */
        md:items-center
        md:justify-between
      ">
        {/* Logo */}
        <div>
          <Image
            src="/logo.svg"
            alt="Company name"
            width={120}
            height={30}
            className="h-8 w-auto"
          />
        </div>

        {/* Links */}
        <nav className="flex gap-4 text-sm">
          <a
            href="mailto:contact@example.com"
            className="
              text-muted-foreground
              hover:text-foreground
              min-h-[48px]              /* Touch target */
              flex items-center
            "
          >
            Contact
          </a>
        </nav>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Company Name. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
```

### Anti-Patterns to Avoid

- **Using `sm:` for mobile styles:** `sm:` means "640px and up", not "small screens". Use unprefixed utilities for mobile.
- **Hardcoding current year:** Use `new Date().getFullYear()` for copyright year
- **Mixing px and rem in breakpoints:** Tailwind v4 uses rem, custom breakpoints should too
- **Missing viewport meta tag:** Without it, responsive styles won't work
- **Forgetting alt text:** Always include descriptive alt text for logos and images
- **48px touch targets on desktop only:** Touch targets should be 48px on ALL devices (mobile users are primary)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom lazy loading | Next.js `Image` component | Handles WebP/AVIF, sizes, lazy loading, prevents CLS automatically |
| Responsive breakpoints | Custom CSS media queries | Tailwind breakpoint prefixes | Consistency, better DX, enforces mobile-first |
| SEO meta tags | Manual `<head>` tags | Next.js Metadata API | Type-safe, automatic merging, prevents duplicates |
| Touch target sizing | Manual calculations | Tailwind utilities + min-h/w | WCAG compliance, consistent across project |
| Copyright year | Hardcoded year | `new Date().getFullYear()` | Automatic, won't become stale |
| Responsive typography | Multiple font-size declarations | Tailwind responsive text utilities | Consistent scale, easier maintenance |

**Key insight:** Next.js and Tailwind provide production-ready solutions for responsive design and SEO. Using these built-in features ensures consistency, maintainability, and adherence to web standards without custom implementation complexity.

## Common Pitfalls

### Pitfall 1: Misunderstanding Mobile-First Breakpoints
**What goes wrong:** Developers use `sm:text-center` thinking it targets mobile, but it actually applies at 640px and UP, leaving mobile without the style.
**Why it happens:** The prefix names (`sm`, `md`, `lg`) are misleading - they describe the breakpoint, not the target screen size.
**How to avoid:**
- Use unprefixed utilities for mobile styles (e.g., `text-center`)
- Use breakpoint prefixes for larger screens (e.g., `md:text-left`)
- Think "at breakpoint and above" not "on small screens"
**Warning signs:** Styles work on desktop but not mobile; repeatedly using `sm:` prefix

### Pitfall 2: Environment Variable Visibility in Production
**What goes wrong:** Environment variables work locally but return `undefined` in production.
**Why it happens:** Next.js only exposes variables prefixed with `NEXT_PUBLIC_` to the browser. Variables without this prefix are server-only.
**How to avoid:**
- Prefix client-side variables with `NEXT_PUBLIC_`
- Add `.env*` files to `.gitignore`
- Test build locally with `next build && next start`
**Warning signs:** Variables work in development but fail after deployment

### Pitfall 3: Case-Sensitive Import Paths in Production
**What goes wrong:** Imports work locally but cause "Module not found" errors in production builds.
**Why it happens:** Development is case-insensitive (macOS/Windows), but production builds (Linux) are case-sensitive.
**How to avoid:**
- Match exact file/folder capitalization in imports
- Use consistent naming conventions
- Run `next build` locally before deploying
**Warning signs:** Build succeeds locally but fails in CI/CD or on Vercel

### Pitfall 4: Touch Targets Below 48px
**What goes wrong:** Buttons and form inputs are hard to tap on mobile devices, causing user frustration and accessibility violations.
**Why it happens:** Designers/developers use desktop-sized targets without considering mobile usability.
**How to avoid:**
- Use `min-h-[48px]` and appropriate padding on all interactive elements
- Test on actual mobile devices, not just browser dev tools
- Use `eslint-plugin-jsx-a11y` to catch violations
**Warning signs:** Users report difficulty tapping buttons; accessibility audits fail

### Pitfall 5: Missing or Incorrect Metadata
**What goes wrong:** Site doesn't appear properly in search results or social media previews; poor SEO ranking.
**Why it happens:** Metadata is often treated as an afterthought or configured incorrectly.
**How to avoid:**
- Configure metadata in root `layout.tsx` using Metadata API
- Include `metadataBase` for absolute URLs
- Test social previews with [Meta Debugger](https://developers.facebook.com/tools/debug/) and [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- Include both OpenGraph and Twitter card metadata
**Warning signs:** Broken previews on social media; missing description in search results

### Pitfall 6: Images Causing Layout Shift
**What goes wrong:** Page content jumps as images load, hurting Core Web Vitals (CLS score).
**Why it happens:** Images don't have dimensions specified, browser can't reserve space.
**How to avoid:**
- Always specify `width` and `height` props on `Image` components
- Use `fill` prop with positioned parent for responsive images
- Add `preload={true}` for above-fold images (hero, logo)
**Warning signs:** Content jumps during page load; poor CLS score in Lighthouse

### Pitfall 7: Forgetting Responsive Typography
**What goes wrong:** Text is too small on mobile or too large on desktop, hurting readability.
**Why it happens:** Using fixed font sizes without responsive scaling.
**How to avoid:**
- Use Tailwind's responsive text utilities: `text-4xl md:text-5xl lg:text-6xl`
- Ensure minimum 16px font size on inputs to prevent iOS zoom
- Test typography at all breakpoints
**Warning signs:** Users zoom in on mobile; text feels cramped or excessive

## Code Examples

Verified patterns from official sources:

### Responsive Section Layout
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Mobile-first section with responsive grid
export function FeaturesSection() {
  return (
    <section className="
      px-4 py-12              /* Mobile: smaller spacing */
      md:px-8 md:py-16        /* Tablet: medium spacing */
      lg:px-12 lg:py-24       /* Desktop: larger spacing */
    ">
      <div className="mx-auto max-w-7xl">
        <h2 className="
          text-3xl font-bold
          md:text-4xl
          lg:text-5xl
        ">
          Features
        </h2>

        <div className="
          mt-8
          grid grid-cols-1      /* Mobile: stack */
          gap-6
          md:grid-cols-2        /* Tablet: 2 columns */
          lg:grid-cols-3        /* Desktop: 3 columns */
          lg:gap-8
        ">
          {features.map((feature) => (
            <FeatureCard key={feature.id} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

### Accessible Form Input with Touch Targets
```tsx
// Source: WCAG 2.5.8, React Hook Form best practices
"use client"

import { useForm } from "react-hook-form"

export function WaitlistForm() {
  const { register, formState: { errors } } = useForm()

  return (
    <form className="w-full max-w-md">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email", { required: true })}
          className="
            w-full
            h-12                          /* 48px touch target */
            px-4
            text-base                     /* Prevents iOS zoom */
            rounded-md
            border
            border-input
            bg-background
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
          "
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && (
          <p
            role="alert"                  /* Screen reader announcement */
            className="text-sm text-destructive"
          >
            Email is required
          </p>
        )}
      </div>

      <button
        type="submit"
        className="
          mt-4
          w-full
          min-h-[48px]                    /* Touch target */
          px-6 py-3
          text-base font-medium
          rounded-md
          bg-primary
          text-primary-foreground
          hover:bg-primary/90
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
        "
      >
        Join Waitlist
      </button>
    </form>
  )
}
```

### Production-Ready Footer
```tsx
// Source: Common footer patterns, Next.js Image best practices
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="
      border-t
      bg-background
      px-4 py-8
      md:px-8
      lg:px-12
    ">
      <div className="
        mx-auto
        max-w-7xl
        flex flex-col
        gap-6
        md:flex-row
        md:items-center
        md:justify-between
      ">
        {/* FOOT-03: Logo/wordmark */}
        <div className="flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="Company name"
            width={120}
            height={30}
            className="h-8 w-auto dark:invert"
          />
        </div>

        {/* FOOT-02: Contact email link */}
        <nav className="flex gap-6">
          <a
            href="mailto:contact@example.com"
            className="
              text-sm text-muted-foreground
              hover:text-foreground
              transition-colors
              min-h-[48px]              /* Touch target */
              flex items-center
            "
          >
            Contact
          </a>
        </nav>

        {/* FOOT-01: Copyright notice */}
        <p className="text-sm text-muted-foreground">
          © {currentYear} Company Name. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
```

### Root Layout Metadata
```tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://riven.dev'), // Replace with actual domain
  title: {
    default: 'Riven - Your Project Tagline',
    template: '%s | Riven'
  },
  description: 'Compelling description that appears in search results and social previews',
  keywords: ['project management', 'developer tools', 'saas'],

  openGraph: {
    title: 'Riven - Your Project Tagline',
    description: 'Compelling description that appears in search results and social previews',
    url: 'https://riven.dev',
    siteName: 'Riven',
    images: [
      {
        url: '/og-image.png',        // 1200x630px recommended
        width: 1200,
        height: 630,
        alt: 'Riven preview'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Riven - Your Project Tagline',
    description: 'Compelling description that appears in search results and social previews',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority={true}` on Image | `preload={true}` | Next.js 16 (2024) | Better semantics, aligns with web standards |
| `tailwind.config.js` | `@theme` directive in CSS | Tailwind v4 (2024) | CSS-first config, simpler, more intuitive |
| Manual `<head>` tags | Metadata API | Next.js 13.2+ (2023) | Type-safe, automatic merging, prevents duplicates |
| 44×44px touch targets | 48×48px recommended | Material Design 3 (2021) | Better usability, especially for older users |
| WCAG 2.5.5 (44×44px) | WCAG 2.5.8 (24×24px minimum) | WCAG 2.2 (2023) | More lenient minimum, but best practice still 48×48px |
| Custom breakpoints in JS config | `--breakpoint-*` CSS variables | Tailwind v4 (2024) | Can be defined inline in CSS, better DX |
| viewport in metadata | generateViewport function | Next.js 13.2+ (2023) | Separate viewport configuration |

**Deprecated/outdated:**
- `priority` prop on Image component: Use `preload` instead (Next.js 16+)
- `viewport`, `themeColor` in metadata: Use `generateViewport` function instead
- JavaScript-based Tailwind config: Use `@theme` directive for most customizations
- Desktop-first responsive design: Mobile-first is now standard practice

## Open Questions

Things that couldn't be fully resolved:

1. **OG Image Generation**
   - What we know: Next.js supports dynamic OG image generation with `opengraph-image.tsx`
   - What's unclear: Whether this phase should include custom OG image or use static image
   - Recommendation: Start with static 1200×630px image in `/public/og-image.png`, can add dynamic generation later if needed

2. **Logo Format**
   - What we know: SVG is preferred for scalability, Next.js Image handles it well
   - What's unclear: Whether user has logo ready or needs placeholder
   - Recommendation: Create placeholder if needed, plan task to add real logo; use SVG format for best quality

3. **Fluid Typography**
   - What we know: CSS `clamp()` enables smooth font scaling, Tailwind plugins available
   - What's unclear: Whether requirements need fluid typography or responsive utilities are sufficient
   - Recommendation: Start with Tailwind's responsive text utilities (`text-4xl md:text-5xl`), only add fluid typography if needed

4. **Bundle Analysis**
   - What we know: `@next/bundle-analyzer` helps identify large dependencies
   - What's unclear: Whether this phase should include bundle optimization or just configuration
   - Recommendation: Install and configure analyzer, run once to verify bundle size is reasonable

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v4 Official Docs - https://tailwindcss.com/docs/responsive-design
- Tailwind CSS v4 Theme Variables - https://tailwindcss.com/docs/theme
- Next.js Image Component API - https://nextjs.org/docs/app/api-reference/components/image
- Next.js Metadata API - https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js Production Checklist - https://nextjs.org/docs/app/guides/production-checklist
- WCAG 2.5.8 Target Size (Minimum) - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4 Breakpoint Override](https://bordermedia.org/blog/tailwind-css-4-breakpoint-override) - Verified with official docs
- [Next.js SEO Guide 2026](https://jsdevspace.substack.com/p/how-to-configure-seo-in-nextjs-16) - Aligns with official Metadata API
- [Mobile-First Design React](https://blog.pixelfreestudio.com/how-to-implement-mobile-first-design-in-react/) - Verified principles
- [React Hook Form Accessibility](https://carlrippon.com/accessible-react-forms/) - Standard a11y practices

### Tertiary (LOW confidence)
- WebSearch results on responsive design mistakes (2026) - General principles, need validation
- WebSearch results on production deployment errors - Common patterns observed, not authoritative
- Fluid typography plugins - Not required for this phase, marked for future consideration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Next.js and Tailwind documentation, current versions verified
- Architecture: HIGH - Patterns from official docs and WCAG standards
- Pitfalls: MEDIUM - Common issues from community experience, some verified with official sources
- Touch targets: HIGH - WCAG 2.5.8 official specification, Material Design guidelines
- Metadata API: HIGH - Official Next.js documentation with comprehensive examples

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable technologies, but check for Next.js/Tailwind updates)
