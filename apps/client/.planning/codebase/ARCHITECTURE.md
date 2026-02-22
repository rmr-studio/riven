# Architecture

**Analysis Date:** 2026-01-19

## Pattern Overview

**Overall:** Feature-Module Architecture with Multi-Tenant SaaS Pattern

**Key Characteristics:**

- Domain-driven feature modules with standardized internal structure
- Next.js App Router for file-based routing with workspace-scoped paths
- Service layer pattern with static class methods for API communication
- Provider-based state composition (React Context + Zustand stores)
- Portal-based rendering for complex grid layouts
- OpenAPI-first type system with feature-level re-exports

## Layers

**Presentation Layer:**

- Purpose: UI components, forms, modals, tables, and user interactions
- Location: `components/feature-modules/*/components/`
- Contains: React components organized by category (forms, modals, tables, ui)
- Depends on: Hooks layer, Service layer, Shared UI components
- Used by: App Router pages

**Hooks Layer:**

- Purpose: Encapsulate data fetching, mutations, and form logic
- Location: `components/feature-modules/*/hooks/`
- Contains: TanStack Query hooks (query/, mutation/), form hooks (form/), custom logic hooks
- Depends on: Service layer, Context providers, Type interfaces
- Used by: Presentation layer

**Service Layer:**

- Purpose: API communication with backend services
- Location: `components/feature-modules/*/service/`
- Contains: Static class methods for HTTP requests (e.g., `EntityTypeService.getEntityTypes()`)
- Depends on: Type interfaces, Shared utilities (error handling, validation)
- Used by: Hooks layer

**State Management Layer:**

- Purpose: Client-side state management and cross-component data sharing
- Location: `components/feature-modules/*/stores/`, `components/feature-modules/*/context/`
- Contains: Zustand store factories (scoped instances), React Context providers
- Depends on: Type interfaces, Hooks layer
- Used by: Presentation layer, Hooks layer

**Type System Layer:**

- Purpose: Type definitions and interfaces
- Location: `components/feature-modules/*/interface/`, `lib/types/types.ts`, `lib/interfaces/`
- Contains: OpenAPI-generated types (lib/types/), feature-level re-exports with semantic names
- Depends on: OpenAPI schema (external)
- Used by: All layers

**Routing Layer:**

- Purpose: URL routing and page composition
- Location: `app/`
- Contains: Next.js App Router pages, layouts, API routes
- Depends on: Presentation layer, Provider layer
- Used by: Next.js framework

**Provider Layer:**

- Purpose: Global application context and initialization
- Location: `components/provider/`
- Contains: Auth provider, Theme provider, QueryClient wrapper, Store wrapper
- Depends on: External services (Supabase, TanStack Query)
- Used by: Root layout

**Shared Utilities Layer:**

- Purpose: Cross-feature utility functions
- Location: `lib/util/`
- Contains: Error handling, form validation, service utilities, Supabase client
- Depends on: None (leaf nodes)
- Used by: Service layer, Hooks layer

## Data Flow

**Server State (Entity CRUD):**

1. User interacts with form component in Presentation layer
2. Form submission triggers mutation hook from Hooks layer
3. Mutation hook calls service method (e.g., `EntityTypeService.saveEntityTypeDefinition()`)
4. Service method validates session, constructs HTTP request to backend API
5. Response parsed and typed as OpenAPI schema type
6. Mutation hook updates TanStack Query cache and shows toast notification
7. Cached data triggers re-render of dependent components

**Client State (Feature Configuration):**

1. Provider creates scoped Zustand store instance for feature (e.g., `createEntityTypeConfigStore()`)
2. Provider initializes React Hook Form instance and passes to store
3. Store subscribes to form changes via `form.watch()`
4. Form changes update store's `isDirty` state and auto-save to localStorage
5. Components access store state via selector hooks (e.g., `useConfigIsDirty()`)
6. Submit triggers store's `handleSubmit()`, which calls mutation
7. On success, store clears draft and resets dirty state

**Block System Rendering Flow:**

1. `BlockEnvironmentProvider` initializes environment state from layout + trees
2. `GridProvider` creates Gridstack instance and manages widget metadata
3. `GridContainerProvider` creates DOM containers for each widget
4. `RenderElementProvider` maps over widgets and renders via React portals
5. For each widget: resolve block node → generate component structure → portal into container
6. `BlockStructureRenderer` resolves dynamic bindings from block payload
7. User interactions trigger tracked environment updates via context methods

**State Management:**

- Server state: TanStack Query (caching, invalidation, optimistic updates)
- Client state: Zustand stores (scoped per feature instance) + React Context
- Form state: React Hook Form with Zod validation
- URL state: Next.js App Router params

## Key Abstractions

**Feature Module:**

- Purpose: Self-contained domain feature with standardized structure
- Examples: `components/feature-modules/entity/`, `components/feature-modules/blocks/`, `components/feature-modules/workspace/`
- Pattern: Consistent subdirectories (components/, hooks/, service/, interface/, stores/, context/, util/)

**Service Class:**

- Purpose: Namespace for API operations related to a domain entity
- Examples: `EntityTypeService`, `EntityService`, `BlockService`, `WorkspaceService`
- Pattern: Static methods, session validation, typed responses, centralized error handling

**Query Hook:**

- Purpose: Encapsulate TanStack Query logic with toast notifications and cache management
- Examples: `useEntityTypes()`, `useSaveDefinitionMutation()`, `useDeleteEntityMutation()`
- Pattern: useMutation/useQuery wrapper, loading toasts, cache updates, error handling

**Store Factory:**

- Purpose: Create scoped Zustand store instances for feature-specific state
- Examples: `createEntityTypeConfigStore()`, per-instance stores
- Pattern: Factory function with closure over dependencies, `subscribeWithSelector` middleware

**Context Provider:**

- Purpose: Inject scoped stores and complex state into component tree
- Examples: `EntityTypeConfigurationProvider`, `BlockEnvironmentProvider`, `AuthProvider`
- Pattern: useRef for stable store instance, useMemo for value object, selector-based hooks

**Block Node:**

- Purpose: Fundamental unit in block composition system
- Examples: `ContentNode` (user data), `ReferenceNode` (entity/block references)
- Pattern: Discriminated unions with type guards (`isContentNode()`, `isReferenceNode()`)

**Portal Rendering:**

- Purpose: Render React components into Gridstack-managed DOM containers
- Examples: `RenderElementProvider` + `PortalContentWrapper`
- Pattern: Map widgets → resolve blocks → generate components → createPortal to containers

## Entry Points

**Root Application:**

- Location: `app/layout.tsx`
- Triggers: Next.js server/client initialization
- Responsibilities: Set up global providers (Theme, Auth, QueryClient, Store), render Toaster

**Dashboard Application:**

- Location: `app/dashboard/layout.tsx`
- Triggers: User navigates to /dashboard/\*
- Responsibilities: Initialize dashboard layout (Sidebar, Navbar), onboarding wrapper

**Landing Page:**

- Location: `app/page.tsx`
- Triggers: User visits root URL
- Responsibilities: Marketing landing page with feature showcase

**Workspace-Scoped Routes:**

- Location: `app/dashboard/workspace/[workspaceId]/**`
- Triggers: User navigates to workspace-specific features
- Responsibilities: Multi-tenant isolation, entity/block/member/subscription management

**Entity Type Configuration:**

- Location: `app/dashboard/workspace/[workspaceId]/entity/[key]/settings/page.tsx`
- Triggers: User opens entity type settings
- Responsibilities: Initialize `EntityTypeConfigurationProvider`, render configuration UI

**API Routes:**

- Location: `app/api/auth/token/callback/route.ts`
- Triggers: OAuth callback from Supabase
- Responsibilities: Exchange code for session, handle redirects

## Error Handling

**Strategy:** Centralized error utilities with typed ResponseError interface

**Patterns:**

- Service layer: `handleError()` utility converts fetch responses to `ResponseError` objects
- All service methods use try/catch with `isResponseError()` type guard
- Mutation hooks display errors via `toast.error()` with user-friendly messages
- Impact-aware operations return 409 status for confirmation workflows
- Session validation throws before API calls (`validateSession()`, `validateUuid()`)

**Error Flow:**

1. Service method catches error
2. `handleError()` or `fromError()` standardizes to `ResponseError`
3. Error propagates to mutation hook
4. Hook's `onError` callback dismisses loading toast and shows error toast
5. User sees contextual error message

## Cross-Cutting Concerns

**Logging:** Console-based (development), client-side errors visible in browser console

**Validation:**

- Schema validation: Zod schemas with React Hook Form integration
- API request validation: `validateSession()`, `validateUuid()` before service calls
- Type validation: OpenAPI-generated types ensure type safety
- Runtime validation: Type guards for discriminated unions (`isContentNode()`, `isEntityReferenceMetadata()`)

**Authentication:**

- Supabase-based session management via `AuthProvider`
- Session stored in React Context (`useAuth()` hook)
- All service methods require session token in Authorization header
- Automatic session refresh via Supabase `onAuthStateChange` subscription
- Protected routes via middleware (not visible in client code)

**Multi-Tenancy:**

- Workspace ID (`workspaceId`) in URL path: `/dashboard/workspace/[workspaceId]/*`
- All API calls scoped by workspace ID
- Query cache keys include workspace ID for isolation
- Store instances scoped per workspace + entity combination

---

_Architecture analysis: 2026-01-19_
