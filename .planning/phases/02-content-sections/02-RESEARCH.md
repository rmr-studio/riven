# Phase 2: Content Sections - Research

**Researched:** 2026-01-18
**Domain:** Landing page content sections, scroll animations, icon-based feature grids, pain point UX
**Confidence:** HIGH

## Summary

This phase builds three content sections (Pain Points, Features, Final CTA) that extend the established Phase 1 infrastructure. The primary challenges are UX/copy-focused rather than technical: crafting pain points that resonate with founders, presenting features as benefits, and creating visual hierarchy that guides visitors toward conversion.

The technical implementation follows established patterns from the Hero section: section components in `components/sections/`, container + padding layout pattern, reuse of WaitlistForm component. New additions include lucide-react icons for feature visualization and Framer Motion scroll-reveal animations.

Research indicates that pain point sections that directly address problems show 45% higher conversion than benefit-only pages (HubSpot 2024). Feature sections should focus on outcomes ("track pipeline velocity") not capabilities ("has a dashboard").

**Primary recommendation:** Structure sections with data-driven content (arrays of pain points/features), animate on scroll with whileInView, and keep the WaitlistForm reuse simple without customization.

## Standard Stack

All libraries already installed from Phase 1. No new dependencies required.

### Icons for Features

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | 0.522.0 | Feature icons | Tree-shakeable, already installed, 1500+ icons |

### Animation for Scroll Reveals

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.26.2 | Scroll-triggered animations | Already installed, React 19 compatible |

### Existing Infrastructure (Reuse)

| Component | Path | Purpose |
|-----------|------|---------|
| WaitlistForm | components/waitlist-form.tsx | Reuse in Final CTA section |
| Button | components/ui/button.tsx | Any CTAs in sections |
| Design tokens | app/globals.css | Colors, spacing, typography |
| cn() utility | lib/utils.ts | Class name composition |

**No installation required.** All libraries from Phase 1 are sufficient.

## Architecture Patterns

### Recommended Project Structure Addition

```
landing/
├── components/
│   └── sections/
│       ├── hero.tsx           # [Phase 1 - exists]
│       ├── pain-points.tsx    # [Phase 2] Problem section
│       ├── features.tsx       # [Phase 2] Features/benefits section
│       └── final-cta.tsx      # [Phase 2] Bottom waitlist form
```

### Pattern 1: Data-Driven Section Content

**What:** Define section content as typed arrays, map to render
**When to use:** Any section with repetitive items (pain points, features, testimonials)
**Why:** Separates content from presentation, easier to modify, type-safe

```typescript
// components/sections/pain-points.tsx
interface PainPoint {
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    title: "Forced into rigid pipelines",
    description: "Your deals don't follow a linear path, but your CRM forces them to.",
  },
  // ... more items
];

export function PainPoints() {
  return (
    <section>
      {painPoints.map((item, index) => (
        <div key={index}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </section>
  );
}
```

### Pattern 2: Feature Card with Icon

**What:** Feature item with lucide-react icon, title, and benefit-focused description
**When to use:** Features section with 3-4 key capabilities

```typescript
// components/sections/features.tsx
import { Blocks, Workflow, GitBranch, LayoutTemplate } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  benefit: string;  // Note: benefit, not description
}

const features: Feature[] = [
  {
    icon: Blocks,
    title: "Custom entity model",
    benefit: "Define objects and relationships that match your business, not ours.",
  },
  {
    icon: Workflow,
    title: "Workflow automation",
    benefit: "Automate the repetitive tasks that drain your team's time.",
  },
  {
    icon: GitBranch,
    title: "Non-linear pipelines",
    benefit: "Track deals that branch, loop back, or skip stages entirely.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates",
    benefit: "Start with pre-built templates, customize to fit your workflow.",
  },
];

// Render with icon component
{features.map((feature) => (
  <div key={feature.title} className="flex flex-col items-center text-center p-6">
    <div className="mb-4 rounded-lg bg-primary/10 p-3">
      <feature.icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-lg font-semibold">{feature.title}</h3>
    <p className="text-muted-foreground">{feature.benefit}</p>
  </div>
))}
```

### Pattern 3: Scroll-Triggered Animation with whileInView

**What:** Animate elements when they enter the viewport
**When to use:** Section headers, feature cards, any below-fold content

```typescript
// Framer Motion scroll reveal pattern
import { motion } from "framer-motion";

// Container variant for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Item variant for individual elements
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Usage in section
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  variants={containerVariants}
  className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
>
  {features.map((feature) => (
    <motion.div key={feature.title} variants={itemVariants}>
      {/* feature card content */}
    </motion.div>
  ))}
</motion.div>
```

### Pattern 4: Section Container Layout

**What:** Consistent section layout matching Hero pattern
**When to use:** All content sections for visual consistency

```typescript
// Standard section layout pattern (matches hero.tsx)
<section className="py-20 lg:py-32">
  <div className="container mx-auto px-4">
    {/* Section header */}
    <div className="mx-auto max-w-3xl text-center mb-16">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        Section headline
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Section subheadline
      </p>
    </div>

    {/* Section content grid */}
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {/* items */}
    </div>
  </div>
</section>
```

### Pattern 5: Final CTA with WaitlistForm Reuse

**What:** Bottom section reusing the existing WaitlistForm component
**When to use:** CTA-03 requirement - secondary waitlist form

```typescript
// components/sections/final-cta.tsx
import { WaitlistForm } from "@/components/waitlist-form";

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to build a CRM that fits?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the waitlist and be first to try Riven.
          </p>
          <div className="mt-8">
            <WaitlistForm className="max-w-md mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Anti-Patterns to Avoid

- **Feature-first copy:** "We have custom entities" instead of "Build objects that match your business"
- **Generic pain points:** "CRMs are bad" instead of "Your deals don't follow a linear path"
- **Animation overload:** Don't animate every element; reserve for key content
- **Inconsistent section spacing:** Stick to py-20 lg:py-32 pattern from hero
- **Creating new form component:** Reuse WaitlistForm exactly as-is

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon library | Custom SVGs | lucide-react | 1500+ icons, tree-shakeable, typed |
| Scroll detection | IntersectionObserver | motion whileInView | Already using Framer Motion |
| Stagger animation | Manual delays | staggerChildren variant | Framer Motion handles timing |
| Section layout | One-off containers | Shared section pattern | Consistency across page |
| Second waitlist form | New form component | WaitlistForm reuse | Already works, tested |

**Key insight:** Phase 1 established all infrastructure. Phase 2 is pure composition and content.

## Common Pitfalls

### Pitfall 1: Features Without Benefits

**What goes wrong:** Features list describes what the product does, not why it matters
**Why it happens:** Developer mindset focuses on capabilities
**How to avoid:** Every feature must answer "so what?" for the user
**Warning signs:** Descriptions start with "We" or "Riven" instead of "You" or implied "you"

### Pitfall 2: Generic Pain Points

**What goes wrong:** Pain points could apply to any software, don't resonate
**Why it happens:** Not specific enough to CRM problems
**How to avoid:** Reference specific CRM frustrations (rigid pipelines, forced workflows, data silos)
**Warning signs:** Pain points don't mention CRM-specific scenarios

### Pitfall 3: Animation Blocking Content

**What goes wrong:** Users scroll fast, miss animated content that hasn't appeared yet
**Why it happens:** Animation delays too long, amount threshold too high
**How to avoid:** Use `viewport={{ once: true, amount: 0.2 }}`, keep durations under 0.5s
**Warning signs:** Content invisible when user scrolls quickly through page

### Pitfall 4: Inconsistent Icon Styling

**What goes wrong:** Icons different sizes, colors, or visual weight across features
**Why it happens:** Each feature styled independently
**How to avoid:** Use consistent icon container: `bg-primary/10 p-3 rounded-lg` with `h-6 w-6 text-primary`
**Warning signs:** Icons look mismatched in the grid

### Pitfall 5: WaitlistForm Double Success State

**What goes wrong:** User submits in hero, scrolls down, final CTA also shows success
**Why it happens:** isSuccess state persists in the mutation hook
**How to avoid:** This is actually correct behavior - both forms share the same mutation state
**Warning signs:** None - this is expected behavior, not a bug

### Pitfall 6: Missing "use client" for Motion Components

**What goes wrong:** Framer Motion components fail to render
**Why it happens:** motion components require client-side rendering
**How to avoid:** Add "use client" to any file using motion components
**Warning signs:** Hydration errors or blank sections

## Code Examples

### Lucide-React Icon Import Pattern

```typescript
// Source: https://lucide.dev/guide/packages/lucide-react
// Import individual icons (tree-shakeable)
import { Blocks, Workflow, GitBranch, LayoutTemplate } from "lucide-react";

// Icons accept size, color, strokeWidth props
<Blocks size={24} className="text-primary" />

// Or use className for all styling
<Workflow className="h-6 w-6 text-primary" />
```

### Recommended Icons for Riven Features

| Feature | Icon | Import Name | Rationale |
|---------|------|-------------|-----------|
| Custom entity model | Building blocks | `Blocks` | Modular, customizable |
| Workflow automation | Flow diagram | `Workflow` | Process automation |
| Non-linear pipelines | Branching paths | `GitBranch` | Non-linear flow |
| Templates | Layout template | `LayoutTemplate` | Pre-built structures |

Alternative icon options:
- `Boxes` - entity/object relationships
- `Zap` - automation speed
- `Route` - custom paths
- `Layers` - hierarchical data

### Complete Pain Points Section

```typescript
// components/sections/pain-points.tsx
"use client";

import { motion } from "framer-motion";

interface PainPoint {
  title: string;
  description: string;
}

const painPoints: PainPoint[] = [
  {
    title: "Forced into rigid pipelines",
    description:
      "Your deals don't follow a linear path, but your CRM forces them into one. Skip a stage? Loop back? Not allowed.",
  },
  {
    title: "One-size-fits-none data model",
    description:
      "You need to track relationships your CRM never imagined. Custom fields aren't enough when the model itself is wrong.",
  },
  {
    title: "Automation that fights you",
    description:
      "Setting up workflows feels like programming a VCR. And when something breaks, good luck debugging it.",
  },
  {
    title: "Built for enterprise, priced for enterprise",
    description:
      "You're paying for features designed for 10,000-person companies. You have a team of 5.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function PainPoints() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Sound familiar?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mt-4 text-lg text-muted-foreground"
          >
            Traditional CRMs force you to work their way. You deserve better.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid gap-8 md:grid-cols-2"
        >
          {painPoints.map((point) => (
            <motion.div
              key={point.title}
              variants={itemVariants}
              className="rounded-lg border border-border bg-background p-6"
            >
              <h3 className="text-lg font-semibold">{point.title}</h3>
              <p className="mt-2 text-muted-foreground">{point.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

### Complete Features Section

```typescript
// components/sections/features.tsx
"use client";

import { motion } from "framer-motion";
import { Blocks, Workflow, GitBranch, LayoutTemplate } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  benefit: string;
}

const features: Feature[] = [
  {
    icon: Blocks,
    title: "Custom entity model",
    benefit:
      "Define your own objects and relationships. Contacts, deals, projects - whatever your business needs.",
  },
  {
    icon: Workflow,
    title: "Workflow automation",
    benefit:
      "Automate repetitive tasks without a PhD in automation. If-this-then-that, but actually useful.",
  },
  {
    icon: GitBranch,
    title: "Non-linear pipelines",
    benefit:
      "Deals branch, loop back, and skip stages. Your pipeline should reflect that.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates",
    benefit:
      "Start with pre-built templates for common workflows. Customize everything from day one.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Features() {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Built for how you actually work
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mt-4 text-lg text-muted-foreground"
          >
            Riven adapts to your business, not the other way around.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="mb-4 rounded-lg bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.benefit}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AOS library | Framer Motion whileInView | 2023+ | No extra dependency, better integration |
| Static feature lists | Data-driven with typed arrays | Best practice | Easier content updates |
| IntersectionObserver manual | motion viewport prop | Framer Motion 4+ | Simpler API |
| Feature descriptions | Benefit-focused copy | Landing page UX research | Higher conversion |

**Deprecated/outdated:**
- Separate scroll animation libraries (AOS, ScrollReveal) - use Framer Motion already in project
- viewport={{ amount: 0.5 }} - too high, content may not animate before user scrolls past

## Open Questions

1. **Exact pain point copy**
   - What we know: 3-4 pain points targeting founders/small teams
   - What's unclear: Final copy requires product/marketing input
   - Recommendation: Use research-based examples, refine in Phase 3

2. **Icon selection**
   - What we know: lucide-react has suitable icons (Blocks, Workflow, GitBranch, LayoutTemplate)
   - What's unclear: These are recommendations, not final decisions
   - Recommendation: Start with recommended icons, swap if better metaphors emerge

3. **Feature order**
   - What we know: 4 features from FEAT-03 requirement
   - What's unclear: Which feature is most compelling, should be first
   - Recommendation: Lead with custom entity model (most differentiating)

## Sources

### Primary (HIGH confidence)
- [Lucide React Guide](https://lucide.dev/guide/packages/lucide-react) - Icon usage, props, tree-shaking
- [Lucide Icons](https://lucide.dev/icons/) - Icon selection
- Phase 1 RESEARCH.md - Established patterns, Framer Motion version
- Existing hero.tsx - Section layout pattern

### Secondary (MEDIUM confidence)
- [LogRocket Framer Motion Scroll](https://blog.logrocket.com/react-scroll-animations-framer-motion/) - whileInView patterns
- [Creating Staggered Animations](https://medium.com/@onifkay/creating-staggered-animations-with-framer-motion-0e7dc90eae33) - staggerChildren variant pattern
- [KlientBoost Startup Landing Pages](https://www.klientboost.com/landing-pages/landing-page-for-startup/) - Features vs benefits copy

### Tertiary (LOW confidence)
- [HubSpot Landing Page Trends 2024](https://blog.hubspot.com/marketing/landing-page-best-practices) - Pain point conversion stats (45% claim)
- [TailwindFlex Feature Cards](https://tailwindflex.com/@manon-daniel/feature-cards-with-icons-on-top) - Card layout inspiration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, no new dependencies
- Architecture patterns: HIGH - Extends established Phase 1 patterns
- Animation patterns: MEDIUM - Based on official docs + community examples
- Copy guidance: MEDIUM - Research-informed but content needs iteration
- Icon selection: MEDIUM - Recommendations based on metaphor, not final

**Research date:** 2026-01-18
**Valid until:** 60 days (stable patterns, no version changes expected)
