# Domain Pitfalls: Pre-Launch SaaS Landing Pages

**Domain:** Pre-launch landing page for complex B2B SaaS (CRM/workspace)
**Researched:** 2026-01-18
**Confidence:** MEDIUM (based on established conversion principles; WebSearch unavailable for 2025-2026 trends)

---

## Critical Pitfalls

Mistakes that kill waitlist conversion or undermine the entire launch.

### Pitfall 1: The Curse of Knowledge (Explaining Product, Not Problem)

**What goes wrong:** You explain what Riven does ("custom entity model, n8n-style workflows, non-linear pipelines") instead of what problem it solves. Visitors don't know what an "entity model" is or why they should care.

**Why it happens:** Founders are deep in their product and forget visitors have zero context. Technical features feel impressive to the builder but mean nothing to the buyer.

**Consequences:**
- Visitors bounce in 3-5 seconds (before scrolling)
- Hero section fails to hook attention
- Waitlist conversion near zero despite traffic

**Warning signs:**
- Hero headline contains product terminology ("dynamic entities", "workflow automation")
- You can't explain the value in 8 words or fewer
- First-time viewers say "I don't get it"

**Prevention:**
- Lead with pain, not features: "Stop fighting your CRM" not "Customizable entity-relationship workspace"
- Use the "So what?" test: After every feature, ask "So what does that mean for me?"
- Get 3 people who don't know your product to read the hero — if they can't explain what you do, rewrite

**Phase to address:** Hero/messaging phase — this must be right before any design work.

---

### Pitfall 2: Bold Tone Without Substance = Cringe

**What goes wrong:** The "bold, disruptive" tone becomes empty posturing. Generic claims like "We're not like the others" or "The future of CRM" without specific proof. Visitors smell BS immediately.

**Why it happens:** "Bold" is interpreted as "use strong adjectives" instead of "make strong claims backed by specifics."

**Consequences:**
- Sophisticated B2B buyers (founders) feel talked down to
- Trust evaporates — if the landing page is all hype, what's the product?
- Brand damage before launch

**Warning signs:**
- Copy includes: "revolutionary", "game-changing", "reimagined", "next-generation"
- Claims could apply to any competitor ("powerful", "flexible", "easy to use")
- No concrete examples, screenshots, or specifics

**Prevention:**
- Bold = specific. "Build a CRM in 10 minutes" not "Incredibly fast setup"
- Show, don't tell: Include even a single screenshot or GIF of the actual product
- Name competitors directly if making comparison claims (or don't make the claim)
- Specificity test: Would a competitor's page make the same claim? If yes, rewrite.

**Phase to address:** Copywriting phase — establish "specific > superlative" principle before any writing.

---

### Pitfall 3: Complex Product = Feature Soup

**What goes wrong:** Riven does many things (entities, workflows, pipelines, templates). The landing page tries to explain all of them, resulting in overwhelming information. Visitors can't hold it all and leave confused.

**Why it happens:** Fear that leaving something out means visitors won't understand the full value. Also, the founder is excited about all the features.

**Consequences:**
- Cognitive overload — visitors retain nothing
- No clear mental model of what the product is
- "Sounds complicated" becomes the takeaway

**Warning signs:**
- Features section has 6+ items with equal visual weight
- Page requires scrolling through multiple feature sections
- You need to explain how features relate to each other

**Prevention:**
- Pick ONE hero benefit — the one that solves the biggest pain (probably "CRM that fits you")
- Max 3 features in detail, others get one-liner mentions
- Use progressive disclosure: Waitlist signup before deep feature explanation
- Create clear visual hierarchy — not all features are equal

**Phase to address:** Information architecture phase — structure before content.

---

### Pitfall 4: Form Friction Kills Conversion

**What goes wrong:** Waitlist form asks for too much (name, company, role, use case) or has poor UX (no loading state, silent failures, unclear success). Every field drops conversion 10-20%.

**Why it happens:** "We want to segment our list" or "More data helps us understand customers." True, but wrong optimization target for pre-launch.

**Consequences:**
- Conversion rate tanks (asking company + role can cut signups by 40%)
- Frustrated users who tried to sign up but hit errors
- Missing signups you'll never know about

**Warning signs:**
- Form has more than 1-2 fields
- No loading indicator during submission
- Success state is subtle or unclear
- Errors aren't clearly communicated

**Prevention:**
- Email only. Nothing else. You can survey them later.
- Obvious loading state (spinner, disabled button, "Joining...")
- Celebrate success: Big, clear confirmation ("You're in! Check your email.")
- Handle errors gracefully: "Something went wrong. Try again?" with preserved input
- Test the form on mobile with slow 3G throttling

**Phase to address:** Form implementation — this is deceptively simple but frequently broken.

---

### Pitfall 5: Mobile Afterthought = 50%+ Lost Traffic

**What goes wrong:** Design looks great on desktop, but mobile is squeezed, broken, or ignored. More than half of traffic is mobile.

**Why it happens:** Designers and devs work on desktop screens. Mobile gets a "quick pass" at the end. Responsive issues are subtle and easy to miss.

**Consequences:**
- Half your traffic bounces immediately
- Form may be unusable on mobile (tiny tap targets, keyboard covers input)
- "Bold" design elements (big typography, wide layouts) break worst on mobile

**Warning signs:**
- Haven't tested on actual phone (not just DevTools)
- Hero text requires horizontal scroll
- CTA button is below the fold on mobile
- Form inputs are hard to tap

**Prevention:**
- Design mobile-first, then expand to desktop
- Test on real devices, not just browser simulation
- Form must be thumb-reachable and visible on mobile viewport
- Big typography must scale down gracefully (test at 320px width)

**Phase to address:** Design phase — mobile-first from the start, not retrofitted.

---

## Moderate Pitfalls

Mistakes that hurt conversion but are recoverable.

### Pitfall 6: No Social Proof = No Trust

**What goes wrong:** Pre-launch page has zero validation signals. Visitors think: "Is this real? Is anyone else interested?" and don't sign up because they don't want to be first.

**Why it happens:** "We're pre-launch, we don't have customers yet." True, but there are other forms of proof.

**Consequences:**
- Lower conversion from hesitant visitors
- Brand feels less established

**Prevention:**
- Show waitlist count after first ~100 signups ("Join 847 founders on the waitlist")
- Founder credibility: "From the team behind X" or personal brand
- Investor/accelerator logos if applicable
- Even "Built by a team who's been there" with founder photos helps

**Phase to address:** Trust elements — can be added post-launch as proof accumulates.

---

### Pitfall 7: Generic Visuals Undermine Bold Claims

**What goes wrong:** Copy says "disruptive" but visuals are stock photos, generic gradients, or look like every other SaaS landing page. Cognitive dissonance kills credibility.

**Why it happens:** Branding is hard. Default to "clean and modern" which ends up looking like everyone else.

**Consequences:**
- Mixed signals — are you really different?
- Forgettable among the sea of landing pages

**Warning signs:**
- Using stock photography
- Color palette is safe blues/grays
- Could swap your logo with a competitor's and it'd look the same

**Prevention:**
- Commit to one bold visual choice (distinctive color, unusual typography, strong illustrations)
- Show the actual product — even rough screenshots are more memorable than polished stock
- If claiming "anti-enterprise," visuals should LOOK anti-enterprise (not corporate)

**Phase to address:** Visual design phase — but set the direction early in branding.

---

### Pitfall 8: Above-the-Fold Misses CTA

**What goes wrong:** Visitors see the hero, understand the product, are interested... but the waitlist form is below the fold. They have to scroll to act. Many don't.

**Why it happens:** Designer prioritizes visual impact. Form "clutters" the hero. Hero image/animation pushes content down.

**Consequences:**
- Interested visitors don't convert because they never see the form
- "I'll sign up later" becomes "I forgot"

**Warning signs:**
- Hero is a full-viewport splash without form visible
- Waitlist CTA requires scrolling on any common viewport size
- Primary CTA is "Learn more" instead of "Join waitlist"

**Prevention:**
- CTA must be visible on 768px height viewport (laptop) without scrolling
- Two CTAs: one in hero, one at bottom (for people who scroll first)
- Primary CTA text should be the waitlist, not a scroll prompt

**Phase to address:** Hero layout — structure this constraint into initial wireframes.

---

### Pitfall 9: Slow Page Load = Abandoned Visits

**What goes wrong:** Hero animation, large images, or heavy JavaScript makes the page take 4+ seconds to become interactive. Visitors leave before it loads.

**Why it happens:** "Bold visual design" interpreted as heavy animations. Next.js default setup doesn't optimize images. Developer doesn't test on throttled connection.

**Consequences:**
- 53% of mobile users leave if load > 3 seconds
- SEO penalty (if that matters for pre-launch)
- Wasted ad spend if running paid traffic

**Warning signs:**
- Hero video or complex animation
- Images not using Next.js Image component with proper sizing
- Heavy third-party scripts loading synchronously
- No performance testing

**Prevention:**
- Target < 2 second LCP (Largest Contentful Paint)
- Use Next.js Image with priority on hero image
- Lazy-load below-fold content
- Test with Lighthouse and Chrome DevTools throttling (3G preset)
- Prefer CSS animations over JavaScript

**Phase to address:** Implementation — but constrain heavy elements during design.

---

### Pitfall 10: Analytics Not Set Up = Flying Blind

**What goes wrong:** Page launches, you get some signups, but you don't know: Where did they come from? How far did they scroll? What did they click? Where did they drop off?

**Why it happens:** "We'll add analytics later." Then later never comes, or it comes after critical launch traffic.

**Consequences:**
- Can't optimize because you can't measure
- Don't know if paid traffic is working
- Miss obvious fixes (e.g., 80% drop-off at a specific section)

**Prevention:**
- Add analytics on day one: Vercel Analytics, Plausible, or PostHog
- Track: Page views, scroll depth, form starts, form completions, UTM sources
- Set up before launch, verify events fire correctly

**Phase to address:** Implementation — non-negotiable for launch readiness.

---

## Minor Pitfalls

Annoyances that are easily fixable but often missed.

### Pitfall 11: Missing Favicon/Meta Tags

**What goes wrong:** Page shares with blank favicon or default Next.js icon. Social previews show broken or missing images. Looks unprofessional.

**Prevention:**
- Set up favicon before launch
- Configure Open Graph meta tags with proper image
- Test with Twitter Card Validator and Facebook Sharing Debugger

**Phase to address:** Polish phase — checklist item before launch.

---

### Pitfall 12: Form Doesn't Work Without JavaScript

**What goes wrong:** If JS fails to load or errors, form does nothing. No error message, just silent failure.

**Prevention:**
- Form should degrade gracefully or show clear error
- Test with JS disabled
- Have a mailto: fallback link somewhere

**Phase to address:** Form implementation — edge case handling.

---

### Pitfall 13: No Email Confirmation = Doubt

**What goes wrong:** User signs up, sees success message, but no email arrives. They wonder if it worked.

**Prevention:**
- Send immediate confirmation email (even if simple)
- If email infra isn't ready, set clear expectation: "We'll email you when we launch"

**Phase to address:** Post-form behavior — depends on backend scope.

---

## Riven-Specific Risk Matrix

Based on PROJECT.md context, here are the highest-risk areas for this specific project:

| Risk Factor | Severity | Why It's Elevated for Riven | Mitigation |
|-------------|----------|------------------------------|------------|
| Curse of Knowledge | CRITICAL | Complex product (entities, workflows, pipelines) + technical founders | Write for "frustrated Pipedrive user", not technical audience |
| Bold Tone Backfire | HIGH | Explicit "bold, disruptive" goal creates pressure to overdo it | Specific > superlative rule; get outside feedback |
| Feature Soup | HIGH | 4+ major features (entity model, workflows, pipelines, templates) | Pick ONE hero message, max 3 features in detail |
| Generic Visuals | MEDIUM | "Creating branding from scratch" = risk of defaulting to safe | Make one bold choice and commit (unusual color? strong type?) |
| No Social Proof | MEDIUM | Pre-launch = no customers yet | Plan for waitlist counter after 100 signups |

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Messaging/Copy | Curse of Knowledge, Bold Tone Backfire | External review before design starts; "So what?" test on every feature |
| Information Architecture | Feature Soup | Force prioritization: 1 hero benefit, 3 max features |
| Visual Design | Generic Visuals, Mobile Afterthought | Make bold choice early; design mobile-first |
| Hero Layout | Above-the-Fold CTA | Wireframe with 768px viewport constraint |
| Form Implementation | Form Friction, Silent Failures | Email only; loading/success/error states; real-device testing |
| Performance | Slow Page Load | LCP < 2s budget; Next.js Image; lazy-load below-fold |
| Pre-Launch | Analytics, Meta Tags | Checklist: Analytics firing, favicons, OG tags, form tested |

---

## Pre-Launch Checklist

Before going live, verify:

- [ ] Hero headline passes "So what?" test with non-technical reviewer
- [ ] Bold claims are backed by specifics, not adjectives
- [ ] Max 3 features get detailed treatment
- [ ] Waitlist form is email-only
- [ ] Form has loading, success, and error states
- [ ] CTA visible without scrolling on 768px height viewport
- [ ] Mobile tested on real device at 320px width
- [ ] LCP < 2 seconds on 3G throttled connection
- [ ] Analytics tracking page views, scroll depth, form conversions
- [ ] Favicon and Open Graph meta tags configured
- [ ] Social share preview tested

---

## Sources

- Established conversion optimization principles (training data)
- PROJECT.md context for Riven-specific risks
- WebSearch unavailable for 2025-2026 trend verification

**Confidence note:** These pitfalls are based on enduring conversion principles that predate 2025. However, specific benchmarks (e.g., mobile traffic percentages, load time thresholds) should be verified with current data if precision matters.
