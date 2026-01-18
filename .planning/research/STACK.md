# Technology Stack

**Project:** Riven Landing Page (Pre-launch SaaS)
**Researched:** 2026-01-18
**Overall Confidence:** HIGH (aligned with existing /client patterns)

## Executive Summary

The landing page stack should mirror the main `/client` application for consistency, developer familiarity, and future code sharing. The existing `/landing` project has Next.js 16.1.1, React 19.2.3, and Tailwind CSS v4 installed. This recommendation adds the minimal set of dependencies needed for a high-converting pre-launch page.

**Key principle:** Don't reinvent. The `/client` app already uses a battle-tested stack. Use the same libraries at compatible versions.

---

## Recommended Stack

### Already Installed (Verified)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16.1.1 | Framework | Installed |
| React | 19.2.3 | UI Library | Installed |
| Tailwind CSS | ^4 | Styling | Installed |
| TypeScript | ^5 | Type Safety | Installed |

### Core Framework Additions

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Query | ^5.81.2 | Server state for waitlist mutation | Matches /client exactly; requirement in PROJECT.md | HIGH |
| React Hook Form | ^7.58.1 | Form handling | Matches /client; lightweight, performant | HIGH |
| Zod | ^3.25.67 | Schema validation | Pairs with RHF via @hookform/resolvers; type-safe | HIGH |
| @hookform/resolvers | ^5.1.1 | Zod-RHF bridge | Same version as /client | HIGH |

**Rationale:** These four libraries form the "form handling + API mutation" foundation. PROJECT.md explicitly requires TanStack Query. Using the same versions as /client ensures patterns are transferable.

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Framer Motion | ^12.23.24 | Page animations | Matches /client; React 19 compatible; declarative API | HIGH |

**Rationale:** Framer Motion is the de-facto standard for React animations. The /client app uses v12.23.24 which supports React 19. Key capabilities for landing pages:
- Scroll-triggered animations (`whileInView`)
- Staggered children animations
- Layout animations for form state changes
- Lightweight compared to GSAP for typical landing page needs

**Alternative Considered:** GSAP
- More powerful for complex timeline animations
- Heavier bundle size (~60KB vs ~30KB)
- Imperative API feels foreign in React
- **Verdict:** Overkill for a landing page. Use Framer Motion.

### UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| class-variance-authority | ^0.7.1 | Component variants | Matches /client; enables variant props | HIGH |
| clsx | ^2.1.1 | Class composition | Matches /client; tiny utility | HIGH |
| tailwind-merge | ^3.3.1 | Tailwind deduplication | Matches /client; prevents class conflicts | HIGH |
| lucide-react | ^0.522.0 | Icons | Matches /client; tree-shakeable | HIGH |

**shadcn/ui Decision:** MEDIUM confidence

The /client uses shadcn/ui patterns extensively. For the landing page:

**Option A: Full shadcn/ui setup**
- Pros: Consistent with /client, ready-made accessible components
- Cons: May be heavy for a single landing page with 2-3 components

**Option B: Copy only needed components**
- Pros: Minimal bundle, no unused code
- Cons: Manual maintenance

**Recommendation:** Install shadcn/ui CLI but only add components as needed. For a waitlist page, you likely need:
- `Button` - CTA buttons
- `Input` - Email input
- `Form` - Form wrapper (optional, can use RHF directly)

```bash
npx shadcn@latest init
npx shadcn@latest add button input
```

### Feedback & Notifications

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| sonner | ^2.0.7 | Toast notifications | Matches /client; best-in-class DX | HIGH |

**Rationale:** Sonner handles success/error feedback for form submission. Matches /client patterns exactly.

### Email Capture Backend (Out of Scope - Patterns Only)

The backend is explicitly out of scope, but the frontend should be ready. Recommended patterns:

**Option 1: Direct API Route (Simplest)**
```typescript
// app/api/waitlist/route.ts
export async function POST(request: Request) {
  const { email } = await request.json();
  // Store in your database or send to email service
  return Response.json({ success: true });
}
```

**Option 2: Third-party Service Integration**
- Resend (email API) - modern, great DX
- ConvertKit / Mailchimp - if you want marketing automation
- Supabase (already used in /client) - store in a `waitlist` table

**Recommendation:** Use Supabase since /client already uses it. Create a `waitlist` table and insert via API route.

---

## Analytics & Tracking Recommendations

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Vercel Analytics | Page views, web vitals | Zero-config with Next.js on Vercel | HIGH |
| Plausible or Fathom | Privacy-friendly analytics | Better for "bold, disruptive" brand positioning | MEDIUM |
| PostHog | Product analytics + feature flags | More powerful, free tier generous | MEDIUM |

**For pre-launch, minimal recommendation:**
1. Vercel Analytics (free, zero-config)
2. Add custom event tracking for waitlist signups

**Skip for now:**
- Google Analytics (privacy concerns, overkill for pre-launch)
- Mixpanel/Amplitude (too heavy for landing page)

---

## Typography Recommendations

The existing setup uses Geist (Vercel's font). This works well for a modern SaaS:

| Font | Purpose | Why |
|------|---------|-----|
| Geist Sans | Body text, UI | Already installed; clean, modern |
| Geist Mono | Code snippets (if any) | Already installed |

**Alternative for "bold, disruptive" tone:** Consider a display font for headlines:
- **Cal Sans** (Cal.com's font) - Open source, bold, modern
- **Inter** - Safe fallback, excellent legibility
- **Space Grotesk** - Geometric, tech-forward

**Recommendation:** Keep Geist for body, optionally add a display font for the hero headline only.

---

## Installation Commands

### Essential Dependencies

```bash
cd /home/jared/dev/riven/landing

# Core form + data fetching (matches /client)
npm install @tanstack/react-query@^5.81.2 react-hook-form@^7.58.1 zod@^3.25.67 @hookform/resolvers@^5.1.1

# Animation
npm install framer-motion@^12.23.24

# UI utilities (matches /client)
npm install class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^3.3.1

# Icons
npm install lucide-react@^0.522.0

# Notifications
npm install sonner@^2.0.7
```

### Optional - shadcn/ui Setup

```bash
# Initialize shadcn/ui (will prompt for configuration)
npx shadcn@latest init

# Add only needed components
npx shadcn@latest add button input
```

### Optional - Analytics

```bash
# If deploying to Vercel
npm install @vercel/analytics
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|-------------------|
| Animation | Framer Motion | GSAP | Heavier, imperative API, overkill for landing page |
| Animation | Framer Motion | react-spring | Framer has better DX, already in /client |
| Animation | Framer Motion | CSS animations | Less control, harder to orchestrate |
| Forms | React Hook Form | Formik | RHF is lighter, better TS support, matches /client |
| Forms | React Hook Form | Native forms | Loses validation, state management benefits |
| Validation | Zod | Yup | Zod has better TS inference, matches /client |
| State | TanStack Query | SWR | TQ has better mutation support, matches /client |
| Icons | Lucide | React Icons | Lucide is tree-shakeable, cleaner API |
| UI | shadcn/ui patterns | Chakra UI | shadcn is lighter, matches /client |
| UI | shadcn/ui patterns | MUI | Too heavy, different design language |

---

## Version Compatibility Matrix

| Library | Version | React 19 | Next.js 16 | Tailwind v4 | Notes |
|---------|---------|----------|------------|-------------|-------|
| TanStack Query | 5.81.2 | Yes | Yes | N/A | Verified in /client |
| React Hook Form | 7.58.1 | Yes | Yes | N/A | Verified in /client |
| Framer Motion | 12.23.24 | Yes | Yes | N/A | Verified in /client |
| Zod | 3.25.67 | Yes | Yes | N/A | Runtime, no React deps |
| clsx | 2.1.1 | N/A | N/A | N/A | Utility, no framework deps |
| tailwind-merge | 3.3.1 | N/A | N/A | Yes | Works with Tailwind v4 |
| sonner | 2.0.7 | Yes | Yes | N/A | Verified in /client |
| lucide-react | 0.522.0 | Yes | Yes | N/A | Verified in /client |

**Confidence:** HIGH - All versions verified against /client/package.json which uses React 19 and similar Next.js version.

---

## File Structure Recommendation

```
landing/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind imports
│   └── api/
│       └── waitlist/
│           └── route.ts    # Waitlist API endpoint (stub)
├── components/
│   ├── ui/                 # shadcn components (button, input)
│   ├── hero.tsx            # Hero section
│   ├── pain-points.tsx     # Pain points section
│   ├── features.tsx        # Features section
│   └── waitlist-form.tsx   # Email capture form
├── hooks/
│   └── use-waitlist-mutation.ts  # TanStack mutation hook
├── lib/
│   └── utils.ts            # cn() utility
└── providers/
    └── query-provider.tsx  # TanStack Query provider
```

---

## Provider Setup Pattern

```typescript
// providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## Mutation Hook Pattern

```typescript
// hooks/use-waitlist-mutation.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef } from "react";

interface WaitlistSubmission {
  email: string;
}

export function useWaitlistMutation() {
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: async (data: WaitlistSubmission) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to join waitlist");
      }

      return response.json();
    },
    onMutate: () => {
      toastRef.current = toast.loading("Joining waitlist...");
    },
    onSuccess: () => {
      toast.success("You're on the list!", { id: toastRef.current });
    },
    onError: (error) => {
      toast.error(error.message, { id: toastRef.current });
    },
  });
}
```

---

## Sources & Confidence

| Claim | Source | Confidence |
|-------|--------|------------|
| Package versions compatible with React 19 | /client/package.json verification | HIGH |
| TanStack Query required | PROJECT.md explicit requirement | HIGH |
| Framer Motion React 19 support | /client uses same version successfully | HIGH |
| shadcn/ui Tailwind v4 compatibility | Training data (needs verification) | MEDIUM |
| Vercel Analytics zero-config | Training data (Vercel documentation) | MEDIUM |
| GSAP bundle size comparison | Training data | LOW |

**Notes on confidence:**
- HIGH: Verified against existing codebase
- MEDIUM: Based on training data, likely accurate but unverified against 2026 docs
- LOW: Based on training data, may have changed

---

## Open Questions

1. **shadcn/ui + Tailwind v4:** The /client appears to use Tailwind v4. Verify shadcn/ui CLI works with Tailwind v4 config during implementation.

2. **Next.js 16 specifics:** Next.js 16 is newer than my training data. Verify any App Router changes that might affect provider patterns.

3. **Framer Motion + React 19 Server Components:** May need `"use client"` directive on animated components. Test during implementation.

---

## Summary for Roadmap

**Stack is well-defined and LOW RISK:**
- All core libraries already proven in /client
- Same versions ensure compatibility
- Patterns are documented in /client/CLAUDE.md
- Minimal new decisions required

**Implementation order:**
1. Install core dependencies (TanStack Query, RHF, Zod)
2. Set up providers (QueryProvider, Toaster)
3. Install animation (Framer Motion)
4. Add UI utilities (cva, clsx, tailwind-merge)
5. Optional: Initialize shadcn/ui for Button/Input
6. Build components using established patterns
