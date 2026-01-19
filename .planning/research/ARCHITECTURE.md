# Landing Page Architecture Patterns

**Domain:** Pre-launch SaaS landing page (waitlist capture)
**Researched:** 2026-01-18
**Confidence:** MEDIUM (based on established conversion optimization patterns; WebSearch unavailable for 2025-2026 trend verification)

## Recommended Section Architecture

The optimal structure for a pre-launch SaaS landing page targeting founders follows a problem-agitation-solution flow with strategic CTA placement.

### Section Order (Top to Bottom)

| Order | Section | Purpose | Conversion Role |
|-------|---------|---------|-----------------|
| 1 | Hero + Primary CTA | Capture attention, state value prop, provide immediate action | Primary conversion point |
| 2 | Pain Points | Create resonance ("they get me"), build problem awareness | Emotional engagement |
| 3 | Solution Overview | Show how Riven solves the pain | Logical justification |
| 4 | Features Breakdown | Concrete proof of capability | Trust building |
| 5 | Social Proof (optional) | Testimonials, logos, early adopter count | Credibility |
| 6 | Final CTA | Catch visitors who scrolled the full page | Secondary conversion point |
| 7 | Footer | Legal, contact, social links | Completeness |

### Rationale for Section Order

**Hero First (not pain points):** Pre-launch pages have approximately 3-8 seconds to capture attention. Leading with a bold value proposition immediately signals "this is for me" before visitors bounce. Pain points come second because visitors who scroll past the hero are already interested and ready for deeper engagement.

**Pain Before Features:** Establishes emotional resonance before logical justification. Founders who feel understood are more likely to convert than founders who are merely impressed by features.

**Dual CTA Placement:** Above-the-fold CTA captures impulse conversions. Bottom CTA captures considered conversions from visitors who needed the full pitch.

## Visual Hierarchy Principles

### Above-the-Fold Priorities

The visible area before scrolling must accomplish three things:

1. **Value Proposition (largest, boldest)** - What is this and why should I care?
2. **Supporting Statement** - One sentence of clarification
3. **Primary CTA** - Clear action with low friction

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           [Value Prop - H1, Bold]               │
│     Build a CRM that fits your business.        │
│                                                 │
│  [Supporting - smaller, muted]                  │
│  Stop contorting your workflows to fit          │
│  rigid tools. Riven adapts to you.              │
│                                                 │
│        ┌─────────────────────────┐              │
│        │   Join the Waitlist     │              │
│        └─────────────────────────┘              │
│                                                 │
│  [Visual element - abstract/product hint]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Typography Hierarchy

| Element | Size | Weight | Purpose |
|---------|------|--------|---------|
| Hero headline | 48-72px | Bold/Black | Primary attention capture |
| Section headers | 32-40px | Bold | Section entry points |
| Feature titles | 20-24px | Semibold | Scannable anchors |
| Body copy | 16-18px | Regular | Readable detail |
| Supporting text | 14px | Regular/Light | Secondary information |

**Bold/Disruptive Tone Implementation:**
- Use maximum contrast (pure black on white or inverse)
- Oversized headlines that feel almost "too big"
- Tight letter-spacing on headlines for density
- Short, punchy copy (sentence fragments work well)
- Active voice, second person ("you," "your")

### Visual Rhythm

Alternate visual weight to maintain engagement:

```
[HIGH DENSITY] Hero - Bold, tight, attention-grabbing
     ↓
[BREATHING ROOM] Pain Points - Generous whitespace, let words land
     ↓
[MEDIUM DENSITY] Features - Grid layout, visual balance
     ↓
[HIGH DENSITY] Final CTA - Return to urgency
```

## CTA Placement Strategy

### Primary CTA (Hero)

**Position:** Center or left-aligned within hero
**Behavior:** Visible without scrolling on all devices
**Design Principles:**
- High contrast (solid background, not outlined)
- Large tap target (min 48px height on mobile)
- Action-oriented text ("Join the Waitlist" > "Submit")
- Single field + button, not multi-step form

**For Riven specifically:**
```
┌────────────────────────────────────────────────────┐
│ [Email input field]        [Join the Waitlist]    │
└────────────────────────────────────────────────────┘
```

### Secondary CTA (Bottom)

**Position:** After all content sections, before footer
**Behavior:** Reward for full-page readers with reinforcement
**Design:** Can mirror hero CTA or use slightly different copy

**Pattern:**
```
─────────────────────────────────────────────────────
       Ready to build your way?

       [Email input]    [Get Early Access]
─────────────────────────────────────────────────────
```

### Sticky CTA (Optional)

**When to use:** Long pages where primary CTA scrolls out of view
**Position:** Bottom of viewport, appears after scrolling past hero
**Risk:** Can feel aggressive; test carefully for founder audience
**Recommendation:** Defer to v2, validate primary conversion first

## Component Boundaries

### Recommended Component Structure

```
landing/
├── app/
│   └── page.tsx           # Page composition only
├── components/
│   ├── sections/
│   │   ├── Hero.tsx       # Headline + CTA form
│   │   ├── PainPoints.tsx # Problem statements
│   │   ├── Features.tsx   # Feature grid/list
│   │   └── FinalCTA.tsx   # Bottom conversion section
│   ├── ui/
│   │   ├── Button.tsx     # Reusable button
│   │   ├── Input.tsx      # Form input
│   │   └── Container.tsx  # Max-width wrapper
│   └── WaitlistForm.tsx   # Form logic (used in Hero + FinalCTA)
├── hooks/
│   └── useWaitlistMutation.ts  # TanStack Query mutation
└── lib/
    └── api.ts             # API client setup
```

### Component Responsibilities

| Component | Responsibility | State |
|-----------|---------------|-------|
| Hero | Layout, headline, form placement | None (renders WaitlistForm) |
| PainPoints | Display pain point content | None (static) |
| Features | Feature grid layout | None (static) |
| FinalCTA | Secondary conversion layout | None (renders WaitlistForm) |
| WaitlistForm | Email input, validation, submission | Local form state + mutation state |

**Key Principle:** Sections are layout/content; form logic is centralized in WaitlistForm and reused.

## Mobile vs Desktop Considerations

### Critical Mobile Adaptations

| Element | Desktop | Mobile |
|---------|---------|--------|
| Hero headline | 48-72px | 32-40px |
| Hero CTA | Inline (email + button) | Stacked (email above button) |
| Feature grid | 3 columns | 1 column |
| Pain points | Side-by-side items | Stacked |
| Touch targets | 44px minimum | 48px minimum |
| Whitespace | Generous | Tighter (preserve content) |

### Mobile-First Priorities

1. **Hero must work standalone** - Mobile visitors often don't scroll. Hero must convert independently.
2. **Reduce cognitive load** - Fewer words, bigger type, clearer hierarchy
3. **Touch-friendly forms** - Large inputs, appropriate keyboard types, visible submit button

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked CTAs |
| Tablet | 640-1024px | Two-column features, inline CTAs |
| Desktop | > 1024px | Full layout, max-width container |

**Container Strategy:**
```css
.container {
  max-width: 1200px;
  padding: 0 24px;  /* Mobile */
  margin: 0 auto;
}

@media (min-width: 640px) {
  .container {
    padding: 0 48px;  /* Tablet+ */
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Feature-First Hero

**What:** Leading with feature list or product capabilities
**Why bad:** Features don't create emotional connection; visitors don't care about capabilities until they understand the problem being solved
**Instead:** Lead with value proposition and pain resonance, defer features

### Anti-Pattern 2: Multi-Step Waitlist Forms

**What:** Asking for name, company, role, use case, etc. on initial capture
**Why bad:** Every field reduces conversion rate by approximately 10-20%. Pre-launch goal is volume, not qualification.
**Instead:** Email only. Qualify leads post-signup if needed.

### Anti-Pattern 3: Generic Stock Photography

**What:** Using generic "team at work" or "person on laptop" images
**Why bad:** Signals "we're like everyone else" — directly contradicts bold/disruptive positioning
**Instead:** Abstract graphics, illustrations, or actual product screenshots (even mockups)

### Anti-Pattern 4: Burying the CTA

**What:** Primary CTA below the fold or hidden in navigation
**Why bad:** Forces all visitors to scroll/search to convert
**Instead:** CTA visible within first viewport on all devices

### Anti-Pattern 5: Passive Voice Copy

**What:** "A CRM that can be customized to your needs"
**Why bad:** Weak, forgettable, enterprise-speak
**Instead:** "Build a CRM that fits YOU" (active, direct, second person)

## Conversion Flow

```
Visitor lands
    │
    ├─── Reads hero headline
    │         │
    │         ├─── Resonates → Enters email → CONVERSION
    │         │
    │         └─── Curious → Scrolls
    │                   │
    │                   ├─── Pain points resonate → Scrolls
    │                   │         │
    │                   │         └─── Features convince → Final CTA → CONVERSION
    │                   │
    │                   └─── Doesn't resonate → BOUNCES
    │
    └─── Bounces immediately (no value prop match)
```

**Optimization Points:**
1. Hero headline clarity (reduce immediate bounces)
2. Pain point resonance (reduce mid-scroll abandonment)
3. CTA friction (reduce form abandonment)

## Performance Considerations

### Load Time Impact on Conversion

| Load Time | Conversion Impact |
|-----------|-------------------|
| < 2s | Baseline |
| 2-4s | 10-20% reduction |
| 4-6s | 30-40% reduction |
| > 6s | 50%+ reduction |

**Optimization Priorities:**
1. Hero content visible within 1.5s (LCP target)
2. CTA interactive within 2s (FID target)
3. No layout shift on images/fonts (CLS target)

**Technical Recommendations:**
- Preload hero fonts
- Use Next.js Image component for optimization
- Inline critical CSS for above-fold content
- Defer non-critical JavaScript

## Sources and Confidence Notes

**Source Limitations:** WebSearch unavailable for this research session. Findings are based on established conversion optimization patterns from training data (up to early 2025). Core principles are stable, but 2025-2026 specific trends are not verified.

**HIGH Confidence:**
- Section ordering principles (problem-solution-proof flow)
- CTA placement strategy (above-fold + bottom)
- Mobile touch target sizing (platform guidelines)
- Form field reduction impact on conversion

**MEDIUM Confidence:**
- Specific font size recommendations (general ranges, not precise)
- Performance thresholds (established benchmarks, may have shifted)
- Visual hierarchy patterns (well-documented but subjective)

**Recommend Verification:**
- Current landing page trends for SaaS (WebSearch when available)
- Specific conversion rate benchmarks for waitlist pages
- Current best practices for Next.js 16 performance optimization
