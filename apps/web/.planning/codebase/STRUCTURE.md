# Codebase Structure

**Analysis Date:** 2026-02-26

## Directory Layout

```
apps/web/
├── app/                           # Next.js app router pages and layout
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (/)
│   ├── template.tsx              # Page transition animation wrapper
│   ├── privacy/
│   │   └── page.tsx              # Privacy policy page
│   ├── robots.ts                 # SEO robots.txt
│   ├── sitemap.ts                # SEO sitemap
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── feature-modules/          # Landing page feature sections
│   │   ├── hero/                 # Hero section
│   │   ├── features/             # Features showcase
│   │   ├── faq/                  # FAQ section
│   │   ├── waitlist/             # Waitlist signup form
│   │   ├── open-source/          # Open source showcase
│   │   ├── time-saved/           # Time saved metrics
│   │   └── cross-domain-intelligence/  # Platform capabilities
│   ├── ui/                       # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── accordion.tsx
│   │   ├── carousel.tsx
│   │   ├── section.tsx           # Landing section container
│   │   └── ...                   # Other primitives
│   ├── navbar.tsx                # Navigation bar
│   └── footer.tsx                # Footer
├── hooks/                         # Custom React hooks
│   ├── use-waitlist-mutation.ts  # Waitlist form mutations
│   ├── use-breakpoint.ts         # Responsive breakpoint detection
│   ├── use-is-mobile.ts
│   ├── use-mounted.ts
│   └── use-container-scale.ts
├── lib/                           # Utility functions and helpers
│   ├── env.ts                    # Environment validation
│   ├── supabase.ts               # Supabase client factory
│   ├── validations.ts            # Zod schemas for forms
│   ├── navigation.ts             # Navigation constants
│   ├── scroll.ts                 # Scroll utilities
│   ├── styles.ts                 # CSS-in-JS style constants
│   ├── interface.ts              # TypeScript interfaces
│   ├── utils.ts                  # Utility functions (cn)
│   └── cdn-image-loader.ts       # Image optimization
├── providers/                     # Context providers
│   ├── auth-provider.tsx         # Authentication context
│   ├── query-provider.tsx        # React Query setup
│   ├── theme-provider.tsx        # Theme context
│   └── motion-provider.tsx       # Motion animations context
├── public/                        # Static assets
│   ├── images/                   # Image files
│   ├── favicon.svg
│   ├── og-image.png
│   └── ...                       # Other static assets
├── .planning/                     # GSD planning documents
│   └── codebase/                 # Architecture documentation
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
└── eslint.config.mjs             # ESLint configuration
```

## Directory Purposes

**app/**
- Purpose: Next.js app router directory containing routes and global layout
- Contains: Page components, layout, template, SEO files
- Key files: `layout.tsx` (providers), `page.tsx` (home page composition), `template.tsx` (page transitions)

**components/feature-modules/**
- Purpose: Self-contained landing page sections with organized internal structure
- Contains: Each module has `components/`, `config/`, and `query/` subdirectories
- Key files: Main export component in `components/` (e.g., `hero/components/hero.tsx`)
- Pattern: Modules are independent and composable on home page

**components/feature-modules/[module]/components/**
- Purpose: React component files for the feature module
- Contains: Main module component and sub-components
- Example: `hero/components/hero.tsx` (main), `hero/components/hero-copy.tsx`, `hero/components/hero-background.tsx`

**components/feature-modules/[module]/config/**
- Purpose: Centralized configuration and constants for the module
- Contains: Step definitions, animation config, styling constants
- Example: `waitlist/config/steps.ts` defines form steps and field mappings

**components/feature-modules/[module]/query/**
- Purpose: Data fetching hooks and mutations for the module
- Contains: React Query hooks for API calls
- Example: `open-source/query/use-github-stars.ts`

**components/ui/**
- Purpose: Reusable UI primitives and custom components
- Contains: Button, carousel, accordion, section containers, animations
- Pattern: Generic, composable, styled with Tailwind and CVA

**hooks/**
- Purpose: Custom React hooks for cross-application logic
- Contains: State management hooks, responsive design hooks, form mutations
- Key files: `use-waitlist-mutation.ts` (form submission), `use-breakpoint.ts` (responsive), `use-is-mobile.ts`, `use-mounted.ts`

**lib/**
- Purpose: Utility functions, validation schemas, constants
- Contains: Environment config, client factories, form validations, helper functions
- Key files:
  - `env.ts` - Zod schema validation for all environment variables
  - `supabase.ts` - Supabase browser client factory
  - `validations.ts` - Zod schemas for waitlist form phases
  - `utils.ts` - Class name merging utility (cn)
  - `navigation.ts` - Nav link constants
  - `scroll.ts` - Scroll to section utility

**providers/**
- Purpose: React Context providers for global state and configuration
- Contains: Auth context, React Query client, theme provider, motion provider
- Key files:
  - `auth-provider.tsx` - Manages Supabase authentication state (optional via AUTH_ENABLED env var)
  - `query-provider.tsx` - React Query client with 60s stale time default
  - `theme-provider.tsx` - next-themes with light/dark/amber themes
  - `motion-provider.tsx` - motion library setup

**public/**
- Purpose: Static assets served by Next.js
- Contains: Images, favicons, metadata images
- Pattern: Images should be optimized before commit; CDN URLs preferred for large images

**next.config.ts**
- Purpose: Next.js configuration and build setup
- Key settings:
  - `output: "standalone"` for Docker deployments
  - Transpiles workspace packages: `@riven/ui`, `@riven/hooks`, `@riven/utils`
  - Remote image patterns for CDN images

**tsconfig.json**
- Purpose: TypeScript configuration
- Key settings:
  - Path alias `@/*` maps to root of this project
  - Extends `@riven/tsconfig/nextjs.json` from workspace
  - Incremental builds enabled

## Key File Locations

**Entry Points:**
- `app/layout.tsx` - Root layout wrapping app in providers, setting metadata, loading fonts
- `app/page.tsx` - Home page composing all feature modules
- `app/template.tsx` - Page transition animation wrapper (runs on route changes)

**Configuration:**
- `next.config.ts` - Build and runtime configuration
- `tsconfig.json` - TypeScript compiler options
- `lib/env.ts` - Environment variable validation schema
- `components/feature-modules/[module]/config/*.ts` - Module-specific configuration

**Core Logic:**
- `providers/auth-provider.tsx` - Authentication state management
- `providers/query-provider.tsx` - Data fetching client setup
- `hooks/use-waitlist-mutation.ts` - Waitlist form submission logic
- `hooks/use-breakpoint.ts` - Responsive design detection

**Testing:**
- No test files found in codebase (testing configuration not detected)

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `Hero.tsx`, `WaitlistForm.tsx`)
- Hooks: `use-` prefix with kebab-case (e.g., `use-waitlist-mutation.ts`, `use-breakpoint.ts`)
- Utilities: camelCase with descriptive names (e.g., `cdn-image-loader.ts`, `validations.ts`)
- Configuration: lowercase with descriptive names (e.g., `steps.ts`, `animation.ts`)
- Directories: kebab-case for feature modules (e.g., `feature-modules`, `cross-domain-intelligence`)

**Components:**
- Export default: Main component from module (e.g., `export default function Home() {}`)
- Named exports: Sub-components and utilities (e.g., `export function WaitlistForm() {}`)
- Props type: Inlined as `React.ReactNode` or interface for complex props

**Functions:**
- Use camelCase (e.g., `useBreakpoint()`, `scrollToSection()`, `createClient()`)
- Utility functions are lowercase camelCase (e.g., `formatStars()`)

**Types:**
- Use PascalCase for interfaces and types (e.g., `AuthContext`, `WaitlistMultiStepFormData`)
- Use UPPERCASE for enums (e.g., `Step.CTA`, `Step.CONTACT`)
- Use UPPERCASE for constants (e.g., `PostgresErrorCode.UniqueViolation`)

## Where to Add New Code

**New Feature Section:**
- Create directory: `components/feature-modules/[feature-name]/`
- Add subdirectories: `components/`, `config/`, `query/` as needed
- Main export: `components/feature-modules/[feature-name]/components/[feature-name].tsx`
- Configuration: `components/feature-modules/[feature-name]/config/` for constants
- Data fetching: `components/feature-modules/[feature-name]/query/` for hooks
- Import in: `app/page.tsx` and compose in Home component

**New UI Component:**
- Create file: `components/ui/[component-name].tsx`
- Export as named export
- Style with Tailwind CSS + CVA for variants
- Make reusable and generic (not specific to features)

**New Custom Hook:**
- Create file: `hooks/use-[hook-name].ts`
- Use React hooks internally (useState, useEffect, useContext, useMutation, useQuery)
- Export as named export
- Document behavior with comments for complex logic

**New Utility Function:**
- Add to existing file in `lib/` or create new: `lib/[utility-name].ts`
- Keep utilities pure and side-effect free
- Include type annotations for parameters and return values

**Form Validations:**
- Add Zod schema to: `lib/validations.ts`
- Follow pattern: Define schema → Export inferred type
- Use schema enums for select/radio fields

**Environment Variables:**
- Add to Zod schema in: `lib/env.ts`
- Include validation rules (required, optional, format checks)
- Add superRefine() logic for cross-field validation if needed

**Global State/Context:**
- Create provider in: `providers/[provider-name].tsx`
- Create context hook: `export function use[ContextName]() { useContext(...) }`
- Wrap in root layout: `app/layout.tsx`
- Make optional with feature flag if appropriate (see `AUTH_ENABLED` pattern)

## Special Directories

**node_modules/**
- Purpose: Installed dependencies from npm
- Generated: Yes (via npm install)
- Committed: No (in .gitignore)

**.next/**
- Purpose: Next.js build output and cache
- Generated: Yes (via next build or dev)
- Committed: No (in .gitignore)

**.planning/codebase/**
- Purpose: GSD codebase mapping documents
- Generated: No (manually created by Claude agents)
- Committed: Yes (tracks architecture decisions)

**.claude/**
- Purpose: Claude AI context and tools
- Generated: Yes
- Committed: No (in .gitignore)

**public/images/**
- Purpose: CDN or local image storage
- Generated: No (manually added)
- Committed: Yes (if small) or tracked via LFS

---

*Structure analysis: 2026-02-26*
