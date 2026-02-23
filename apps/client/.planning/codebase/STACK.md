# Technology Stack

**Analysis Date:** 2026-01-19

## Languages

**Primary:**

- TypeScript 5.x - All application code, strict mode enabled
- JavaScript (ES2017+) - Configuration files

**Secondary:**

- CSS - Styling via Tailwind CSS

## Runtime

**Environment:**

- Node.js 20.x (20-alpine in Docker)
- Browser (modern ES6+ support required)

**Package Manager:**

- npm 11.7.0
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**

- Next.js 15.3.4 - Full-stack React framework with App Router
- React 19.0.0 - UI library
- React DOM 19.0.0 - DOM rendering

**Testing:**

- Jest 29.7.0 - Test runner
- Testing Library (React) 16.1.0 - Component testing
- ts-jest 29.3.4 - TypeScript support for Jest
- jest-environment-jsdom 29.7.0 - DOM environment

**Build/Dev:**

- TypeScript Compiler 5.x - Type checking
- ESLint 9.x - Linting (extends `next/core-web-vitals`, `next/typescript`)
- PostCSS - CSS processing
- Tailwind CSS 4.x - Utility-first CSS framework

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.50.0 - Supabase client SDK for auth and storage
- `@supabase/ssr` 0.6.1 - Server-side rendering utilities for Supabase
- `@tanstack/react-query` 5.81.2 - Server state management, caching, mutations
- `zustand` 5.0.8 - Client-side state management
- `react-hook-form` 7.58.1 - Form state management
- `zod` 3.25.67 - Schema validation

**Infrastructure:**

- `gridstack` 12.3.3 - Drag-and-drop grid layout system
- `@xyflow/react` 12.10.0 - Node-based workflow diagrams
- `@radix-ui/*` (20+ packages) - Headless UI primitives for shadcn/ui components
- `framer-motion` 12.23.24 - Animation library
- `openapi-typescript` 7.8.0 - TypeScript type generation from OpenAPI specs

**UI Components:**

- `lucide-react` 0.522.0 - Icon library
- `sonner` 2.0.7 - Toast notifications
- `cmdk` 1.1.1 - Command menu
- `recharts` 2.15.4 - Charting library
- `react-day-picker` 9.7.0 - Date picker
- `react-phone-number-input` 3.4.12 - Phone number input

**Utilities:**

- `date-fns` 4.1.0 - Date manipulation
- `dayjs` 1.11.19 - Date formatting
- `uuid` 11.1.0 - UUID generation
- `validator` 13.15.15 - Input validation
- `class-variance-authority` 0.7.1 - Variant management
- `clsx` 2.1.1 - Class name utilities
- `tailwind-merge` 3.3.1 - Tailwind class merging

**Data Handling:**

- `@tanstack/react-table` 8.21.3 - Table state management
- `@tanstack/react-virtual` 3.13.13 - Virtual scrolling
- `jsonpath-plus` 10.3.0 - JSONPath queries
- `jsonpointer` 5.0.1 - JSON pointer implementation

**DnD & Interaction:**

- `@dnd-kit/core` 6.3.1 - Drag and drop primitives
- `@dnd-kit/sortable` 10.0.0 - Sortable lists
- `@dnd-kit/modifiers` 9.0.0 - DnD modifiers
- `@dnd-kit/utilities` 3.2.2 - DnD utilities
- `react-resizable-panels` 3.0.6 - Resizable panel layouts

## Configuration

**Environment:**

- Configuration via environment variables
- Required variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase instance URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `NEXT_PUBLIC_API_URL` - Backend API base URL
  - `NEXT_PUBLIC_HOSTED_URL` - Frontend hosting URL
  - `NEXT_PUBLIC_SUPABASE_STORAGE_URL` - Supabase storage URL
- Development: `NODE_ENV=development` for debug logging

**Build:**

- `tsconfig.json` - TypeScript configuration (strict mode, path aliases `@/*`)
- `next.config.ts` - Next.js configuration (minimal/default)
- `eslint.config.mjs` - ESLint configuration
- `jest.config.ts` - Jest test configuration
- `postcss.config.mjs` - PostCSS with Tailwind plugin

## Platform Requirements

**Development:**

- Node.js 20.x or higher
- npm 11.x or higher
- Modern browser with ES6+ support
- Backend API running at `NEXT_PUBLIC_API_URL` (localhost:8081 for type generation)

**Production:**

- Docker (multi-stage build with node:20-alpine)
- Port 3000 exposed
- Environment variables configured
- Supabase instance provisioned
- Backend API accessible

---

_Stack analysis: 2026-01-19_
