# Feature Landscape: Pre-Launch SaaS Landing Page

**Domain:** Pre-launch landing page for B2B SaaS (CRM/workspace platform)
**Researched:** 2026-01-18
**Confidence:** MEDIUM (based on established landing page patterns; WebSearch unavailable for 2025/2026 trend verification)

## Table Stakes

Features users expect. Missing = page feels incomplete or untrustworthy.

| Feature/Section | Why Expected | Complexity | Conversion Impact | Notes |
|-----------------|--------------|------------|-------------------|-------|
| Hero section with clear headline | First impression; visitors decide in 3-5 seconds | Low | Critical | Must immediately communicate what Riven is and who it's for |
| Single, clear CTA | Visitors need obvious next action | Low | Critical | "Join waitlist" — one primary action, not competing CTAs |
| Email capture form | Core goal of pre-launch page | Low | Critical | Simple form, minimal fields (email only for v1) |
| Value proposition statement | Explains why this exists | Low | High | "Build a CRM that fits your business" — one sentence max |
| Problem/pain point section | Validates visitor's frustration | Medium | High | Call out what's broken with existing CRMs |
| Feature highlights | Shows what the product does | Medium | High | 3-4 key capabilities, not exhaustive feature list |
| Mobile responsive design | 40-60% traffic is mobile | Medium | High | Non-negotiable for credibility |
| Fast load time (<3s) | Abandonment spikes after 3s | Low-Medium | High | Especially important for waitlist conversion |
| Basic branding (logo, colors) | Establishes legitimacy | Low | Medium | Doesn't need to be polished, but needs to exist |
| Footer with company/legal basics | Legitimacy signal | Low | Low | Copyright, maybe privacy link — minimal is fine |

## Differentiators

Features that increase conversion rates. Not expected, but valued.

| Feature/Section | Value Proposition | Complexity | Conversion Impact | Notes |
|-----------------|-------------------|------------|-------------------|-------|
| **Bold, disruptive copy** | Stands out from generic SaaS pages | Low | High | "Stop contorting your business" > "Flexible CRM solution" |
| **Social proof indicators** | Builds trust pre-launch | Low | High | Even "Founded by ex-[Company]" or "Backed by [investors]" works |
| **Waitlist count/momentum** | FOMO, social proof | Low | Medium-High | "Join 847 founders on the waitlist" — but only if numbers are real |
| **Early access incentive** | Gives reason to act now | Low | Medium-High | "First 100 get lifetime discount" or "Early access to beta" |
| **Product preview/visuals** | Makes product tangible | Medium-High | High | Screenshots, mockups, or demo video — shows it's real |
| **Comparison framing** | Positions against alternatives | Medium | Medium-High | "Unlike Salesforce..." — but don't be petty, be confident |
| **Founder story/personality** | Humanizes the company | Medium | Medium | Works well for anti-enterprise positioning |
| **Specific target audience call-out** | Self-selection | Low | Medium-High | "For founders and small teams" — visitors know if it's for them |
| **Interactive element** | Engagement + memorability | High | Medium | Example: "Describe your business, we'll show you your CRM" — high effort |
| **Waitlist confirmation with referral** | Viral loop | Medium | Medium | "Invite friends, move up the list" — can boost signups 20-40% |
| **Manifesto/beliefs section** | Emotional connection | Medium | Medium | "We believe..." — resonates with values-aligned visitors |
| **"Coming soon" feature teaser** | Sets expectations | Low | Low-Medium | Brief roadmap of what's planned |

## Anti-Features

Things to deliberately NOT include on pre-launch pages.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Pricing section** | No product yet = no pricing validation; creates objections | Remove entirely — "Pricing TBD" is worse than nothing |
| **Multiple CTAs** | Dilutes focus, reduces conversions | One CTA: join waitlist. Everything else is secondary |
| **Extensive feature lists** | Overwhelms, feels like vaporware | 3-4 key features with benefits, not 15 checkboxes |
| **Login/signup flows** | Pre-launch means no product to log into | Just waitlist — auth comes later |
| **Blog/content pages** | Scope creep, distracts from launch goal | Single landing page until product exists |
| **Complex forms** | Every field reduces conversion 10-20% | Email only, maybe name. No company size dropdowns |
| **Generic stock photos** | Signals inauthenticity | Custom visuals, product mockups, or abstract graphics |
| **Enterprise buzzwords** | Conflicts with anti-enterprise positioning | "Synergy," "leverage," "robust" — avoid these |
| **Competitor bashing** | Comes across as insecure | Confident positioning without naming competitors directly |
| **Detailed documentation** | Product doesn't exist yet | Brief feature descriptions, not API docs |
| **Chat widgets/support** | No product = nothing to support | Email link for inquiries is sufficient |
| **Cookie consent banners** | Pre-launch often doesn't need tracking | If no analytics cookies, no banner needed |
| **Feature comparison tables** | Implies feature parity you may not have | Use narrative positioning instead |

## Feature Dependencies

```
Hero Section (headline + CTA)
    |
    v
Email Capture Form <-- Validation + Success State
    |
    v
Problem/Pain Point Section
    |
    v
Feature Highlights (3-4 key capabilities)
    |
    v
[Optional] Social Proof / Founder Story
    |
    v
Footer

Key dependencies:
- Form depends on: Hero establishing context first
- Features depend on: Problem section establishing "why"
- Social proof depends on: Having something credible to say
```

## Section-by-Section Recommendations

### Hero Section

**Purpose:** Capture attention, communicate value, drive action

**Must have:**
- Bold headline (benefit-focused, not product-focused)
- Subheadline with clarifying value prop
- Single CTA button (email input + submit)
- Visual element (product mockup, abstract graphic, or bold typography)

**Recommended copy pattern:**
```
[Provocative statement or bold claim]
[One sentence explaining what/who/why]
[CTA: Join the waitlist]
```

**For Riven specifically:**
- Lead with the anti-rigid-CRM angle
- Call out founders/small teams explicitly
- CTA should feel exclusive ("Get early access" > "Sign up")

### Problem Section

**Purpose:** Validate visitor's frustration, create resonance

**Must have:**
- 2-4 specific pain points
- Relatable language (not abstract)
- Connection to solution

**For Riven specifically:**
Pain points to call out:
1. Forced to use entity models that don't match your business
2. Linear pipelines when deals don't move linearly
3. Enterprise complexity for small team needs
4. Changing tools as you scale (HubSpot -> Salesforce migration pain)

### Features Section

**Purpose:** Show what makes this different

**Must have:**
- 3-4 key features max
- Benefit-focused (what it enables, not what it is)
- Visual representation (icons, mockups)

**For Riven specifically:**
1. Custom entity model — "Define contacts, deals, projects as they exist in YOUR business"
2. Non-linear pipelines — "Deals don't always move forward. Neither should your pipeline."
3. Workflow automation — "If this, then that. But actually powerful."
4. Templates — "Start with what works, customize from there."

### Social Proof Section (if applicable)

**Purpose:** Build trust before product exists

**Options for pre-launch:**
- Founder credentials ("Built by [relevant experience]")
- Investor backing (if applicable)
- Waitlist count (if substantial)
- Early testimonials from beta users (if any)

**For Riven:** If no social proof available yet, skip this section rather than fabricating it. Authenticity matters for the anti-enterprise positioning.

## MVP Recommendation

For MVP landing page, prioritize:

1. **Hero + Email Capture** (critical path)
   - Bold headline
   - Single-line value prop
   - Email input + submit button
   - Success state

2. **Problem Section** (conversion driver)
   - 3 specific pain points
   - Connects to target audience frustration

3. **Feature Highlights** (differentiation)
   - 4 key features with benefits
   - Icons or minimal visuals

4. **Footer** (legitimacy)
   - Logo
   - Copyright
   - Email contact

Defer to post-MVP:
- Social proof section: Need real data first
- Founder story: Can add if conversion needs boosting
- Interactive elements: High effort, uncertain payoff
- Referral system: Good addition once basic funnel works

## Conversion Optimization Notes

**Above the fold matters most:**
- 80% of engagement happens above the fold
- Email capture should be visible without scrolling on desktop
- Mobile: First scroll should include CTA

**Copy > Design for pre-launch:**
- Bold, specific copy converts better than generic pretty design
- "Join 847 founders" > "Join our newsletter"
- "Build YOUR CRM" > "Flexible CRM platform"

**Reduce friction ruthlessly:**
- Email only, no name field (adds 10-20% conversion)
- No CAPTCHA (unless spam becomes problem)
- Instant feedback on submit (success state, not page reload)

**For Riven's anti-enterprise positioning:**
- Avoid corporate language ("leverage," "enterprise-grade," "synergy")
- Use direct language ("Build," "Your," "Actually works")
- Confidence, not arrogance — show don't tell

## Sources

- Landing page conversion patterns (established marketing knowledge, MEDIUM confidence)
- Pre-launch SaaS patterns (industry standard practices, MEDIUM confidence)
- Form conversion optimization (well-documented field, HIGH confidence)

**Note:** WebSearch was unavailable during this research. Recommendations are based on established landing page patterns. For 2025/2026-specific trends (e.g., AI integration, new tools), additional research may be warranted.

---
*Research conducted for Riven pre-launch landing page*
