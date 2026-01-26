# Codebase Structure

**Analysis Date:** 2026-01-19

## Directory Layout

```
client/
├── app/                                    # Next.js App Router (file-based routing)
│   ├── api/                               # API routes
│   │   └── auth/token/callback/           # OAuth callback handler
│   ├── auth/                              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                         # Authenticated app
│   │   ├── workspace/[workspaceId]/       # Workspace-scoped routes
│   │   │   ├── entity/[key]/              # Dynamic entity type routes
│   │   │   ├── members/
│   │   │   ├── subscriptions/
│   │   │   └── usage/
│   │   ├── settings/
│   │   ├── templates/
│   │   └── layout.tsx                     # Dashboard layout
│   ├── waitlist/
│   ├── layout.tsx                         # Root layout (providers)
│   ├── page.tsx                           # Landing page
│   └── globals.css                        # Global styles
│
├── components/
│   ├── feature-modules/                   # Domain-driven feature modules
│   │   ├── authentication/
│   │   ├── blocks/                        # Block composition system
│   │   │   ├── components/
│   │   │   │   ├── bespoke/              # Custom block components
│   │   │   │   ├── blocks/               # Block UI primitives
│   │   │   │   ├── entity/               # Entity-related block components
│   │   │   │   ├── forms/                # Form components + widgets
│   │   │   │   │   └── widgets/          # Form input widgets registry
│   │   │   │   ├── handle/               # Drag handles
│   │   │   │   ├── modals/               # Block modals
│   │   │   │   ├── navigation/           # Block navigation
│   │   │   │   ├── panel/                # Editor panel + toolbar
│   │   │   │   ├── primitive/            # Low-level primitives
│   │   │   │   ├── render/               # Rendering system
│   │   │   │   │   ├── list/             # List rendering
│   │   │   │   │   └── reference/        # Reference rendering
│   │   │   │   ├── shared/               # Shared block components
│   │   │   │   └── sync/                 # Sync utilities
│   │   │   ├── config/                   # Block configuration
│   │   │   ├── context/                  # Block providers
│   │   │   ├── hooks/                    # Block hooks
│   │   │   ├── interface/                # Block type definitions
│   │   │   ├── service/                  # Block API services
│   │   │   ├── styles/                   # Block-specific styles
│   │   │   └── util/                     # Block utilities
│   │   │       ├── block/                # Block manipulation
│   │   │       ├── command/              # Command pattern
│   │   │       ├── environment/          # Environment management
│   │   │       ├── grid/                 # Gridstack integration
│   │   │       ├── list/                 # List utilities
│   │   │       ├── navigation/           # Navigation utilities
│   │   │       └── render/               # Rendering utilities
│   │   ├── entity/                        # Entity management system
│   │   │   ├── components/
│   │   │   │   ├── dashboard/            # Entity dashboards
│   │   │   │   ├── forms/                # Entity forms
│   │   │   │   │   ├── instance/         # Entity instance forms
│   │   │   │   │   │   └── relationship/ # Instance relationship forms
│   │   │   │   │   └── type/             # Entity type forms
│   │   │   │   │       ├── attribute/    # Attribute forms
│   │   │   │   │       └── relationship/ # Type relationship forms
│   │   │   │   ├── tables/               # Entity tables
│   │   │   │   ├── types/                # Type-related components
│   │   │   │   └── ui/                   # Entity UI components
│   │   │   │       ├── modals/           # Entity modals
│   │   │   │       │   ├── instance/
│   │   │   │       │   └── type/
│   │   │   │       └── popover/          # Entity popovers
│   │   │   ├── context/                  # Entity providers
│   │   │   ├── hooks/                    # Entity hooks
│   │   │   │   ├── form/                 # Form hooks
│   │   │   │   │   └── type/
│   │   │   │   ├── mutation/             # Mutation hooks
│   │   │   │   │   ├── instance/
│   │   │   │   │   └── type/
│   │   │   │   └── query/                # Query hooks
│   │   │   │       └── type/
│   │   │   ├── interface/                # Entity type definitions
│   │   │   ├── service/                  # Entity API services
│   │   │   ├── stores/                   # Entity Zustand stores
│   │   │   │   └── type/
│   │   │   └── util/                     # Entity utilities
│   │   ├── landing/                       # Landing page components
│   │   ├── onboarding/
│   │   ├── user/
│   │   └── workspace/
│   ├── provider/                          # Global providers
│   │   ├── ThemeContext.tsx
│   │   ├── auth-context.tsx
│   │   └── drag-drop-context.tsx
│   └── ui/                                # shadcn/ui components (70+ files)
│       ├── background/
│       ├── nav/
│       └── sidebar/
│
├── hooks/                                 # Global custom hooks
│   ├── use-media-query.ts
│   └── use-mobile.ts
│
├── lib/
│   ├── interfaces/                        # Shared type definitions
│   │   ├── common.interface.ts
│   │   ├── interface.ts
│   │   └── template.interface.ts
│   ├── types/
│   │   └── types.ts                       # OpenAPI-generated types
│   └── util/                              # Shared utilities
│       ├── country/
│       ├── error/                         # Error handling utilities
│       ├── form/                          # Form utilities
│       ├── service/                       # Service utilities
│       ├── storage/
│       ├── supabase/
│       │   └── client.ts                  # Supabase client
│       ├── debounce.util.ts
│       └── utils.ts                       # General utilities (cn, api)
│
├── .planning/                             # Planning documents
│   └── codebase/                          # Codebase documentation
│
├── .vscode/                               # VSCode configuration
├── package.json                           # Dependencies and scripts
└── tsconfig.json                          # TypeScript configuration
```

## Directory Purposes

**app/**

- Purpose: Next.js App Router for file-based routing
- Contains: Pages (page.tsx), layouts (layout.tsx), API routes (route.ts)
- Key files: `layout.tsx` (root providers), `dashboard/layout.tsx` (authenticated layout)

**components/feature-modules/**

- Purpose: Domain-driven feature modules with standardized structure
- Contains: Complete features (components, hooks, services, types, stores)
- Key modules: `blocks/` (69 components), `entity/` (23 components)

**components/feature-modules/\*/components/**

- Purpose: UI components for a feature module
- Contains: Subdirectories by component category (forms/, modals/, tables/, ui/)
- Pattern: One component per file, kebab-case filenames

**components/feature-modules/\*/hooks/**

- Purpose: Custom React hooks for a feature module
- Contains: Subdirectories by hook type (query/, mutation/, form/)
- Pattern: `use-{name}.ts`, encapsulate reusable logic

**components/feature-modules/\*/service/**

- Purpose: API communication layer
- Contains: Static class services (e.g., `entity-type.service.ts`)
- Pattern: `{domain}.service.ts`, static methods only

**components/feature-modules/\*/interface/**

- Purpose: Type definitions and interfaces for a feature
- Contains: Re-exported OpenAPI types with semantic names
- Pattern: `{domain}.interface.ts`, re-export from `lib/types/types.ts`

**components/feature-modules/\*/stores/**

- Purpose: Zustand state management
- Contains: Store factories for scoped instances
- Pattern: `{domain}.store.ts`, factory functions returning store API

**components/feature-modules/\*/context/**

- Purpose: React Context providers for complex state
- Contains: Provider components that inject stores/state
- Pattern: `{domain}-provider.tsx`, exports provider + hooks

**components/feature-modules/\*/util/**

- Purpose: Feature-specific utility functions
- Contains: Helper functions, data transformations, calculations
- Pattern: `{category}.util.ts`, pure functions

**components/provider/**

- Purpose: Global application providers
- Contains: Auth, theme, query client, store wrappers
- Key files: `auth-context.tsx`, `ThemeContext.tsx`

**components/ui/**

- Purpose: shadcn/ui component library (Radix primitives)
- Contains: 70+ reusable UI components
- Pattern: Customized Radix components with Tailwind styling

**lib/types/**

- Purpose: OpenAPI-generated TypeScript types
- Contains: `types.ts` (generated from backend schema)
- Pattern: Generated via `npm run types` command

**lib/interfaces/**

- Purpose: Shared type definitions not from OpenAPI
- Contains: Common interfaces, generic types
- Key files: `interface.ts`, `common.interface.ts`

**lib/util/**

- Purpose: Cross-feature utility functions
- Contains: Error handling, form validation, service utilities
- Key files: `error/error.util.ts`, `service/service.util.ts`, `supabase/client.ts`

**hooks/**

- Purpose: Global custom hooks (not feature-specific)
- Contains: Media queries, mobile detection
- Pattern: `use-{name}.ts`

**.planning/codebase/**

- Purpose: Codebase documentation for AI assistants and developers
- Contains: Architecture, structure, conventions, testing docs
- Pattern: UPPERCASE.md files

## Key File Locations

**Entry Points:**

- `app/layout.tsx`: Root layout with global providers
- `app/page.tsx`: Landing page
- `app/dashboard/layout.tsx`: Dashboard layout
- `app/dashboard/workspace/[workspaceId]/page.tsx`: Workspace home

**Configuration:**

- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.ts`: Tailwind CSS configuration (likely exists)
- `.eslintrc.*`: ESLint configuration (likely exists)

**Core Logic:**

- `components/feature-modules/entity/service/entity-type.service.ts`: Entity type API
- `components/feature-modules/blocks/context/block-environment-provider.tsx`: Block state management
- `lib/util/error/error.util.ts`: Centralized error handling
- `lib/util/service/service.util.ts`: Service layer utilities

**Testing:**

- `components/feature-modules/blocks/components/bespoke/__tests__/`: Block component tests
- Pattern: `*.test.ts` or `*.spec.ts` co-located or in `__tests__/`

## Naming Conventions

**Files:**

- Components: `kebab-case.tsx` (e.g., `entity-type-header.tsx`)
- Utilities: `kebab-case.util.ts` (e.g., `error.util.ts`)
- Services: `kebab-case.service.ts` (e.g., `entity-type.service.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-save-definition-mutation.ts`)
- Stores: `kebab-case.store.ts` (e.g., `configuration.store.ts`)
- Interfaces: `kebab-case.interface.ts` (e.g., `entity.interface.ts`)
- Providers: `kebab-case-provider.tsx` (e.g., `configuration-provider.tsx`)

**Directories:**

- Feature modules: `kebab-case` (e.g., `entity`, `blocks`)
- Subdirectories: `kebab-case` (e.g., `feature-modules`, `entity-type`)
- Next.js routes: `kebab-case` or `[param]` for dynamic routes

**Code:**

- Components: `PascalCase` (e.g., `EntityTypeHeader`)
- Hooks: `use{Name}` prefix (e.g., `useEntityTypes`)
- Services: `PascalCase` classes (e.g., `EntityTypeService`)
- Types/Interfaces: `PascalCase` (e.g., `EntityType`, `BlockNode`)
- Functions: `camelCase` (e.g., `validateSession`, `handleError`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects

## Where to Add New Code

**New Feature Module:**

- Create: `components/feature-modules/{feature-name}/`
- Add subdirectories: `components/`, `hooks/`, `interface/`, `service/`, `util/`
- Add `interface/{feature-name}.interface.ts` with OpenAPI re-exports
- Add `service/{feature-name}.service.ts` with static methods
- Add query/mutation hooks in `hooks/query/` and `hooks/mutation/`
- Add UI components in `components/`

**New Component (within existing feature):**

- Implementation: `components/feature-modules/{feature}/components/{category}/{component-name}.tsx`
- Category: Choose from `forms/`, `modals/`, `tables/`, `ui/`, or create new category
- Pattern: Export component as default or named export

**New API Service Method:**

- Add to: `components/feature-modules/{feature}/service/{domain}.service.ts`
- Pattern: Static method, session validation, typed response, error handling
- Example: `static async getSomething(session: Session | null, ...): Promise<Type>`

**New Query/Mutation Hook:**

- Query hook: `components/feature-modules/{feature}/hooks/query/{hook-name}.ts`
- Mutation hook: `components/feature-modules/{feature}/hooks/mutation/{hook-name}.ts`
- Pattern: Wrap TanStack Query, add toasts, cache updates, call service method

**New Form Hook:**

- Add to: `components/feature-modules/{feature}/hooks/form/{hook-name}.ts`
- Pattern: Initialize `useForm` with Zod schema, return form instance + handlers
- Use when: Form is isolated and doesn't need global state

**New Context Provider:**

- Add to: `components/feature-modules/{feature}/context/{domain}-provider.tsx`
- Pattern: Create store in useRef, provide via Context, export selector hooks
- Use when: State needed across multiple nested components

**New Zustand Store:**

- Add to: `components/feature-modules/{feature}/stores/{domain}.store.ts`
- Pattern: Factory function that returns store API, use `subscribeWithSelector`
- Use when: Scoped state per instance (e.g., per entity type)

**New Utility Function:**

- Feature-specific: `components/feature-modules/{feature}/util/{category}.util.ts`
- Shared: `lib/util/{category}/{name}.util.ts`
- Pattern: Pure functions, exported as named exports

**New Type Definition:**

- OpenAPI type: Add to backend schema, run `npm run types`
- Feature interface: Re-export in `components/feature-modules/{feature}/interface/{domain}.interface.ts`
- Shared type: Add to `lib/interfaces/{category}.interface.ts`

**New Page/Route:**

- Page: `app/{path}/page.tsx`
- Layout: `app/{path}/layout.tsx`
- Dynamic route: `app/{path}/[param]/page.tsx`
- API route: `app/api/{path}/route.ts`

**New Test:**

- Unit test: Co-located `{component}.test.tsx` or in `__tests__/{component}.test.tsx`
- Integration test: `{feature}/__tests__/{scenario}.test.tsx`
- Pattern: Follow existing test structure in `blocks/components/bespoke/__tests__/`

**Shared UI Component:**

- Add to: `components/ui/{component-name}.tsx`
- Pattern: shadcn/ui style, Radix primitives with Tailwind
- Use when: Component is reusable across multiple features

**Global Provider:**

- Add to: `components/provider/{provider-name}.tsx`
- Register in: `app/layout.tsx` provider hierarchy
- Use when: State needed across entire application

## Special Directories

**components/feature-modules/blocks/components/forms/widgets/**

- Purpose: Registry of form input widget components
- Generated: No
- Committed: Yes
- Usage: Dynamic form rendering based on widget type
- Pattern: Each widget exports component + default value for registry

**lib/types/**

- Purpose: OpenAPI-generated TypeScript types
- Generated: Yes (via `npm run types`)
- Committed: Yes (but regenerated as backend changes)
- Usage: DO NOT import directly; re-export in feature interfaces

**node_modules/**

- Purpose: Installed npm dependencies
- Generated: Yes (via `npm install`)
- Committed: No

**.next/**

- Purpose: Next.js build output
- Generated: Yes (via `npm run build`)
- Committed: No

**.planning/**

- Purpose: Documentation for development workflow
- Generated: No (manually maintained)
- Committed: Yes
- Usage: Reference for AI assistants and developers

**components/ui/**

- Purpose: shadcn/ui component library
- Generated: Partially (via shadcn CLI)
- Committed: Yes
- Usage: Import UI components, customize as needed

---

_Structure analysis: 2026-01-19_
