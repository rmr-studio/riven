# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- TypeScript 5.x - All source files (`app/`, `lib/`, `components/`, `hooks/`, `providers/`)
- JSX/TSX - React component definitions

**Secondary:**
- JavaScript - Build configuration and tooling

## Runtime

**Environment:**
- Node.js 22 (Alpine) - Specified in `Dockerfile`

**Package Manager:**
- pnpm 10.28.2 - Defined in Dockerfile
- Lockfile: pnpm-lock.yaml (present)

## Frameworks

**Core:**
- Next.js 16.1.1 - Main application framework
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS framework (`postcss.config.mjs`)
- Tailwind CSS PostCSS 4 - CSS processing plugin
- Class Variance Authority 0.7.1 - Variant composition for styling
- Radix UI 1.4.3 - Accessible component primitives
- Lucide React 0.522.0 - Icon library

**Motion & Animation:**
- Framer Motion 12.26.2 - Advanced animation library
- Motion React 0.15.0-alpha.1 - React bindings for Motion
- Embla Carousel React 8.6.0 - Carousel component

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- @hookform/resolvers 5.2.2 - Form validation resolver
- Zod 3.25.76 - Type-safe schema validation

**State Management:**
- @tanstack/react-query 5.90.19 - Server state management
- @tanstack/react-table 8.21.3 - Table state management

**Theme & Provider:**
- next-themes 0.4.6 - Theme management (light/dark/amber)

**Notifications:**
- Sonner 2.0.7 - Toast notification system

**Analytics:**
- posthog-js 1.352.0 - Product analytics and event tracking

**Utilities:**
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.4.0 - Tailwind class merging utility
- react-icons 5.5.0 - Icon library integration

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.97.0 - Supabase client for database access
- @supabase/ssr 0.6.1 - Server-side rendering support for Supabase

**Monorepo Workspace Packages:**
- @riven/ui (workspace:*) - Shared UI components
- @riven/hooks (workspace:*) - Custom React hooks
- @riven/utils (workspace:*) - Utility functions
- @riven/tsconfig (workspace:*) - Shared TypeScript configuration

**Development:**
- TypeScript 5.x - Language compiler
- ESLint 9.x - Code linting
- eslint-config-next 16.1.1 - Next.js specific ESLint rules
- Prettier 0.7.2 plugin for Tailwind - Code formatter with Tailwind class sorting
- @types/node 20.x - Node.js type definitions
- @types/react 19.x - React type definitions
- @types/react-dom 19.x - React DOM type definitions

## Configuration

**Environment:**
- Environment variables loaded from root `.env` file via `dotenv` CLI in npm scripts
- Validation schema defined in `lib/env.ts` using Zod
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional vars: `NEXT_PUBLIC_AUTH_ENABLED`, `NEXT_PUBLIC_CLIENT_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CDN_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_COOKIE_DOMAIN`

**Build:**
- `next.config.ts` - Next.js configuration with:
  - Turbopack enabled with monorepo root
  - Standalone output mode for Docker deployment
  - Transpiled workspace packages
  - Remote image patterns (cdn.riven.software)
- `tsconfig.json` - TypeScript configuration extending @riven/tsconfig
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS
- `eslint.config.mjs` - ESLint configuration with Next.js rules
- `.prettierrc` - Prettier configuration with Tailwind plugin

**TypeScript:**
- Strict mode enabled (via @riven/tsconfig/nextjs.json)
- Path aliases: `@/*` maps to project root
- JSX: react-jsx (automatic JSX transform)

## Platform Requirements

**Development:**
- Node.js 22.x
- pnpm 10.28.2
- Environment variables from `.env` (loaded by dotenv CLI)

**Production:**
- Deployment target: Docker container (Node.js 22 Alpine)
- Output: Next.js standalone build
- Port: 3000
- Environment variables provided at runtime

**Fonts:**
- Google Fonts integrated via next/font:
  - Geist (sans-serif, main font)
  - Geist Mono (monospace)
  - Instrument Serif (serif, custom variant)
  - Space Mono (monospace, weights 400/700)

---

*Stack analysis: 2026-02-26*
