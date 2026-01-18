# Phase 1: Hero + Infrastructure - Research

**Researched:** 2026-01-18
**Domain:** React form handling, TanStack Query mutations, Tailwind v4 + shadcn/ui, landing page UX
**Confidence:** HIGH

## Summary

This phase establishes the core infrastructure for the landing page (TanStack Query, React Hook Form, Zod, Sonner) and builds the hero section with email capture. The technical stack is well-defined because it mirrors the existing `/client` application - same libraries, same versions, same patterns.

The research verified that all chosen libraries are compatible with the current landing page setup (Next.js 16.1.1, React 19.2.3, Tailwind CSS v4). shadcn/ui fully supports Tailwind v4 with updated patterns. The `/client` codebase provides authoritative reference implementations for mutation hooks with toast notifications.

**Primary recommendation:** Follow `/client` patterns exactly for form + mutation logic. Focus implementation effort on hero UX and branding rather than infrastructure decisions.

## Standard Stack

The established libraries for this phase. All versions match `/client/package.json` for consistency.

### Core Form + Data Fetching

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.81.2 | Server state, mutations | Required by PROJECT.md; proven in /client |
| react-hook-form | ^7.58.1 | Form state management | Lightweight, performant, matches /client |
| zod | ^3.25.67 | Schema validation | Type-safe, pairs with RHF, matches /client |
| @hookform/resolvers | ^5.1.1 | Zod-RHF bridge | Required for zodResolver |

### Feedback + Notifications

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sonner | ^2.0.7 | Toast notifications | Best-in-class DX, proven in /client |

### UI Utilities

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | ^0.7.1 | Component variants | Enables variant props like /client |
| clsx | ^2.1.1 | Class composition | Tiny utility, matches /client |
| tailwind-merge | ^3.3.1 | Tailwind deduplication | Prevents class conflicts |
| lucide-react | ^0.522.0 | Icons | Tree-shakeable, matches /client |

### Animation (for Phase 1 button states, optional scroll later)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.23.24 | Animations | React 19 compatible, matches /client |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Hook Form | Formik | RHF is lighter, better TS support |
| Zod | Yup | Zod has better TS inference |
| TanStack Query | SWR | TQ has better mutation support |
| Sonner | react-hot-toast | Sonner has better DX, already in /client |

**Installation:**
```bash
cd /home/jared/dev/riven-landing-worktree/landing

# Core form + data fetching (matches /client)
npm install @tanstack/react-query@^5.81.2 react-hook-form@^7.58.1 zod@^3.25.67 @hookform/resolvers@^5.1.1

# Feedback
npm install sonner@^2.0.7

# UI utilities (matches /client)
npm install class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^3.3.1

# Icons
npm install lucide-react@^0.522.0

# Animation
npm install framer-motion@^12.23.24
```

## Architecture Patterns

### Recommended Project Structure

```
landing/
├── app/
│   ├── layout.tsx          # Root layout with QueryProvider + Toaster
│   ├── page.tsx            # Landing page composition
│   ├── globals.css         # Tailwind v4 + brand tokens
│   └── api/
│       └── waitlist/
│           └── route.ts    # Waitlist API endpoint (stub)
├── components/
│   ├── sections/
│   │   └── hero.tsx        # Hero section layout
│   ├── ui/
│   │   ├── button.tsx      # shadcn-style button
│   │   └── input.tsx       # shadcn-style input
│   └── waitlist-form.tsx   # Email capture form (reusable)
├── hooks/
│   └── use-waitlist-mutation.ts  # TanStack mutation hook
├── lib/
│   ├── utils.ts            # cn() utility
│   └── validations.ts      # Zod schemas
└── providers/
    └── query-provider.tsx  # TanStack Query provider
```

### Pattern 1: QueryClient Provider Setup

**What:** Wrap application in QueryClientProvider for mutation support
**When to use:** Required for any TanStack Query usage

```typescript
// providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures QueryClient is created once per component instance
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

### Pattern 2: Mutation Hook with Toast Lifecycle

**What:** useMutation with loading/success/error toast transitions
**When to use:** Any form submission that calls an API

```typescript
// hooks/use-waitlist-mutation.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef } from "react";

interface WaitlistSubmission {
  email: string;
}

interface WaitlistResponse {
  success: boolean;
  message?: string;
}

export function useWaitlistMutation() {
  // Ref tracks toast ID for loading -> success/error transition
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: async (data: WaitlistSubmission): Promise<WaitlistResponse> => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to join waitlist");
      }

      return response.json();
    },
    onMutate: () => {
      // Show loading toast, store ID for later dismissal
      toastRef.current = toast.loading("Joining waitlist...");
    },
    onSuccess: () => {
      // Replace loading toast with success
      toast.success("You're on the list!", { id: toastRef.current });
    },
    onError: (error: Error) => {
      // Replace loading toast with error
      toast.error(error.message, { id: toastRef.current });
    },
  });
}
```

### Pattern 3: React Hook Form with Zod

**What:** Form with schema validation, integrated with mutation
**When to use:** Any validated form

```typescript
// components/waitlist-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWaitlistMutation } from "@/hooks/use-waitlist-mutation";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export function WaitlistForm() {
  const { mutate, isPending, isSuccess } = useWaitlistMutation();

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: WaitlistFormData) => {
    mutate(data);
  };

  // Show success state after submission
  if (isSuccess) {
    return (
      <div className="text-center">
        <p className="text-lg font-medium">You're on the list!</p>
        <p className="text-muted-foreground">We'll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
      <input
        {...form.register("email")}
        type="email"
        placeholder="Enter your email"
        disabled={isPending}
        className="..."
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "Joining..." : "Join Waitlist"}
      </button>
      {form.formState.errors.email && (
        <p className="text-destructive">{form.formState.errors.email.message}</p>
      )}
    </form>
  );
}
```

### Pattern 4: Tailwind v4 CSS Variables with shadcn/ui

**What:** Brand color tokens using Tailwind v4 @theme directive
**When to use:** Establishing design system

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  /* Brand colors - bold, not corporate */
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);

  /* Primary - choose a bold color */
  --primary: hsl(262 83% 58%);        /* Example: vibrant purple */
  --primary-foreground: hsl(0 0% 98%);

  /* Muted for supporting text */
  --muted: hsl(0 0% 96.1%);
  --muted-foreground: hsl(0 0% 45.1%);

  /* Destructive for errors */
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(0 0% 98%);

  /* Border and input */
  --border: hsl(0 0% 89.8%);
  --input: hsl(0 0% 89.8%);
  --ring: hsl(262 83% 58%);

  /* Radius */
  --radius: 0.5rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius: var(--radius);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Anti-Patterns to Avoid

- **Creating QueryClient in render:** Always use useState or useRef to create QueryClient once
- **Using useMemo for QueryClient:** Use useState instead - useMemo can be called multiple times
- **Inline mutation functions:** Extract to hooks for reusability and testing
- **Skipping loading states:** Always show isPending state to users
- **Silent form errors:** Always surface validation errors visibly

## Don't Hand-Roll

Problems that look simple but have existing solutions.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom regex checks | Zod schema | Edge cases (Unicode emails, etc.) |
| Form state | useState for each field | React Hook Form | Performance, validation integration |
| Loading/error states | Custom state management | TanStack Query | Built-in isPending, isError, retry |
| Toast notifications | Custom portal + animation | Sonner | Accessibility, animation, queueing |
| Class name merging | Template literals | cn() with tailwind-merge | Prevents conflicting classes |
| Email validation | Simple regex | Zod z.string().email() | Handles edge cases correctly |

**Key insight:** The /client already solved all these problems. Copy patterns, don't reinvent.

## Common Pitfalls

### Pitfall 1: QueryClient Created on Every Render

**What goes wrong:** `new QueryClient()` in component body creates new instance each render
**Why it happens:** Developer doesn't understand React lifecycle
**How to avoid:** Use useState(() => new QueryClient()) pattern
**Warning signs:** Data refetches unexpectedly, cache doesn't persist

### Pitfall 2: Missing "use client" Directive

**What goes wrong:** Hooks fail with "hooks can only be called in client components"
**Why it happens:** Next.js App Router defaults to server components
**How to avoid:** Add "use client" to any file using useState, useForm, useMutation
**Warning signs:** Runtime error about hooks on page load

### Pitfall 3: Toast ID Not Used for Transitions

**What goes wrong:** Loading toast stays visible, success toast appears separately
**Why it happens:** Developer doesn't pass ID from onMutate to onSuccess/onError
**How to avoid:** Use ref pattern from /client (toastRef.current = toast.loading(...))
**Warning signs:** Multiple toasts appearing, loading toast doesn't dismiss

### Pitfall 4: Form Not Disabled During Submission

**What goes wrong:** User double-submits, creates duplicate entries
**Why it happens:** Button/inputs not disabled when isPending is true
**How to avoid:** Always pass disabled={isPending} to form controls
**Warning signs:** Multiple API calls in network tab for single submission

### Pitfall 5: Zod Validation on Wrong Mode

**What goes wrong:** Validation fires on every keystroke (annoying) or only on submit (surprising)
**Why it happens:** Wrong mode option in useForm
**How to avoid:** Use mode: "onBlur" for balance between feedback and UX
**Warning signs:** Errors appearing while typing, or no errors until submit

### Pitfall 6: Tailwind v4 Color Variable Syntax

**What goes wrong:** Colors don't apply, CSS errors in console
**Why it happens:** v4 changed from @apply with hsl() to @theme inline pattern
**How to avoid:** Follow shadcn/ui Tailwind v4 guide exactly
**Warning signs:** Missing colors, theme not applying

## Code Examples

Verified patterns from official sources and /client codebase.

### Root Layout with Providers

```typescript
// app/layout.tsx
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Riven | Build a CRM that fits your business",
  description: "Stop contorting your workflows to fit rigid tools. Riven adapts to you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
```

### cn() Utility Function

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Button Component (shadcn-style)

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### API Route Stub

```typescript
// app/api/waitlist/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual backend
    // For now, just simulate success
    console.log("Waitlist signup:", email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| isLoading state | isPending state | TanStack Query v5 | Renamed for clarity |
| useMutation(fn, opts) | useMutation({ mutationFn }) | TanStack Query v5 | Object-only syntax |
| tailwind.config.js | @theme directive in CSS | Tailwind v4 | CSS-first configuration |
| React.forwardRef | ComponentProps pattern | shadcn + React 19 | Simpler component definitions |
| tailwindcss-animate | tw-animate-css | Tailwind v4 | Plugin change |
| @layer base for :root | :root outside @layer | Tailwind v4 | CSS structure change |

**Deprecated/outdated:**
- `isLoading` in TanStack Query - use `isPending` instead
- JavaScript tailwind.config.js - use CSS @theme for Tailwind v4
- HSL color variables - shadcn/ui v4 uses OKLCH internally

## Open Questions

Things that couldn't be fully resolved:

1. **Backend waitlist endpoint integration**
   - What we know: API route stub is sufficient for Phase 1
   - What's unclear: Final backend implementation (Supabase table? External service?)
   - Recommendation: Build with stub, user wires backend separately (per PROJECT.md scope)

2. **Product visual/mockup for hero**
   - What we know: HERO-08 requires product visual
   - What's unclear: What asset will be used (screenshot, illustration, abstract graphic?)
   - Recommendation: Design hero layout to accommodate ~400-600px visual element; placeholder until asset decided

3. **Exact brand colors**
   - What we know: "Bold, not corporate" directive; anti-enterprise
   - What's unclear: Specific hex values for primary color
   - Recommendation: Establish one bold primary color (suggest vibrant purple or similar) in Phase 1; can refine in Phase 3

## Sources

### Primary (HIGH confidence)
- `/client/package.json` - Version numbers verified
- `/client/components/util/query.wrapper.tsx` - QueryClient pattern
- `/client/components/feature-modules/entity/hooks/mutation/type/use-save-definition-mutation.ts` - Mutation + toast pattern
- `/client/app/layout.tsx` - Provider composition, Sonner usage

### Secondary (MEDIUM confidence)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) - CSS variable patterns
- [TanStack Query v5 Mutations](https://tanstack.com/query/v5/docs/framework/react/guides/mutations) - useMutation API
- [React Hook Form Resolvers](https://github.com/react-hook-form/resolvers) - zodResolver usage

### Tertiary (LOW confidence)
- WebSearch results for 2026 patterns - limited recent results, but core patterns stable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against /client which uses React 19
- Architecture: HIGH - Patterns copied directly from working /client code
- Pitfalls: HIGH - Based on /client patterns and official documentation
- Branding: MEDIUM - Principles clear, specific colors TBD

**Research date:** 2026-01-18
**Valid until:** 60 days (stable libraries, well-documented patterns)
