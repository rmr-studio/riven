# Phase 1: Foundation - Research

**Researched:** 2025-01-25
**Domain:** OpenAPI Generator API factories and ignore file configuration
**Confidence:** HIGH

## Summary

Phase 1 requires creating API factory functions for BlockApi, UserApi, and WorkspaceApi, following the established pattern in `lib/api/entity-api.ts`. Additionally, the `.openapi-generator-ignore` file must be updated to protect custom directories (`lib/types/entity/`, `lib/types/block/`, `lib/types/workspace/`, `lib/types/user/`) from being deleted during code regeneration.

The existing `createEntityApi` factory demonstrates the exact pattern to follow: import the API class and Configuration from `@/lib/types`, import Session from `@/lib/auth`, validate environment configuration, create a Configuration instance with basePath and accessToken, and return the constructed API instance.

**Primary recommendation:** Follow the established factory pattern exactly, add four directory exclusion patterns to `.openapi-generator-ignore`, and verify with `npm run types`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @openapitools/openapi-generator-cli | 2.28.0 | Generate TypeScript API clients from OpenAPI spec | Industry standard for OpenAPI code generation |
| typescript-fetch | (generator) | Generated client uses fetch API | Built-in, no extra dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/lib/auth | internal | Provides Session type with access_token | All API factory functions require session |
| @/lib/types | generated | Exports Configuration, API classes, models | Central import for all generated types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| typescript-fetch | typescript-axios | axios adds dependency; fetch is native and already working |
| Factory functions | Direct API instantiation | Factory pattern centralizes configuration, already established |

**Installation:**
No additional packages required - all dependencies already present.

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── api/                     # API factory functions (custom, protected)
│   ├── entity-api.ts       # Existing factory
│   ├── block-api.ts        # To create (API-01)
│   ├── user-api.ts         # To create (API-02)
│   └── workspace-api.ts    # To create (API-03)
├── types/                   # Generated + custom directories
│   ├── apis/               # Generated API classes
│   ├── models/             # Generated model types
│   ├── runtime.ts          # Generated runtime utilities
│   ├── index.ts            # Generated barrel export
│   ├── entity/             # Custom barrel (future, must protect)
│   ├── block/              # Custom barrel (future, must protect)
│   ├── workspace/          # Custom barrel (future, must protect)
│   └── user/               # Custom barrel (future, must protect)
└── auth/                    # Authentication module
```

### Pattern 1: API Factory Function
**What:** A function that creates a configured API instance from a session
**When to use:** Every generated API class needs a factory
**Example:**
```typescript
// Source: lib/api/entity-api.ts (existing)
import { EntityApi, Configuration } from "@/lib/types";
import { Session } from "@/lib/auth";

export function createEntityApi(session: Session): EntityApi {
    const basePath = process.env.NEXT_PUBLIC_API_URL;
    if (!basePath) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const config = new Configuration({
        basePath,
        accessToken: async () => session.access_token,
    });

    return new EntityApi(config);
}
```

### Pattern 2: OpenAPI Generator Ignore for Directories
**What:** Glob patterns in `.openapi-generator-ignore` that prevent directory deletion/overwrite
**When to use:** Any custom directories inside the generated output folder
**Example:**
```
# Protect custom domain barrel directories
entity/**
block/**
workspace/**
user/**
```

### Anti-Patterns to Avoid
- **Direct API instantiation in components:** Always use factory functions to ensure consistent configuration
- **Hardcoded base paths:** Always use `NEXT_PUBLIC_API_URL` environment variable
- **Synchronous accessToken:** The Configuration expects an async function for accessToken

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API authentication | Manual header injection | Configuration.accessToken | Generated code handles Bearer token automatically |
| Base URL configuration | Hardcoded strings | process.env.NEXT_PUBLIC_API_URL | Environment-specific configuration |
| Error handling | Custom try/catch in factory | Let errors propagate | Factory should only construct, service layer handles errors |

**Key insight:** The generated API classes already handle all HTTP concerns (headers, serialization, deserialization). Factories just configure and construct.

## Common Pitfalls

### Pitfall 1: Forgetting async accessToken
**What goes wrong:** Configuration expects `accessToken` to be a function returning a string or Promise, not a raw string
**Why it happens:** Intuitive to just pass `session.access_token` directly
**How to avoid:** Always wrap in async function: `accessToken: async () => session.access_token`
**Warning signs:** TypeScript error about accessToken type mismatch

### Pitfall 2: Including /api in basePath
**What goes wrong:** Generated API paths already include `/api/v1/...`, so basePath should NOT include `/api`
**Why it happens:** Natural to think the base URL should include the API prefix
**How to avoid:** Use `NEXT_PUBLIC_API_URL` which points to server root (e.g., `http://localhost:8081`)
**Warning signs:** 404 errors with doubled `/api/api` in path

### Pitfall 3: Ignore file path patterns
**What goes wrong:** Using wrong glob syntax causes directories to not be protected
**Why it happens:** .openapi-generator-ignore follows .gitignore syntax which has specific rules
**How to avoid:** Use `directoryname/**` pattern to exclude all files recursively in a directory
**Warning signs:** Running `npm run types` deletes custom directories

### Pitfall 4: Not validating environment variable
**What goes wrong:** API calls fail with unclear error at runtime
**Why it happens:** Missing environment variable causes undefined basePath
**How to avoid:** Check for undefined and throw descriptive error before creating Configuration
**Warning signs:** Runtime errors about "undefined" in URL

## Code Examples

Verified patterns from official sources:

### BlockApi Factory (to create)
```typescript
// Source: Pattern from lib/api/entity-api.ts
import { BlockApi, Configuration } from "@/lib/types";
import { Session } from "@/lib/auth";

/**
 * Creates a BlockApi instance configured with session-based authentication.
 * Uses NEXT_PUBLIC_API_URL for base path (without /api suffix - generated paths include it).
 *
 * @param session - Supabase session with access_token
 * @returns Configured BlockApi instance
 * @throws Error if session is invalid or API URL not configured
 */
export function createBlockApi(session: Session): BlockApi {
    const basePath = process.env.NEXT_PUBLIC_API_URL;
    if (!basePath) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const config = new Configuration({
        basePath,
        accessToken: async () => session.access_token,
    });

    return new BlockApi(config);
}
```

### UserApi Factory (to create)
```typescript
// Source: Pattern from lib/api/entity-api.ts
import { UserApi, Configuration } from "@/lib/types";
import { Session } from "@/lib/auth";

/**
 * Creates a UserApi instance configured with session-based authentication.
 * Uses NEXT_PUBLIC_API_URL for base path (without /api suffix - generated paths include it).
 *
 * @param session - Supabase session with access_token
 * @returns Configured UserApi instance
 * @throws Error if session is invalid or API URL not configured
 */
export function createUserApi(session: Session): UserApi {
    const basePath = process.env.NEXT_PUBLIC_API_URL;
    if (!basePath) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const config = new Configuration({
        basePath,
        accessToken: async () => session.access_token,
    });

    return new UserApi(config);
}
```

### WorkspaceApi Factory (to create)
```typescript
// Source: Pattern from lib/api/entity-api.ts
import { WorkspaceApi, Configuration } from "@/lib/types";
import { Session } from "@/lib/auth";

/**
 * Creates a WorkspaceApi instance configured with session-based authentication.
 * Uses NEXT_PUBLIC_API_URL for base path (without /api suffix - generated paths include it).
 *
 * @param session - Supabase session with access_token
 * @returns Configured WorkspaceApi instance
 * @throws Error if session is invalid or API URL not configured
 */
export function createWorkspaceApi(session: Session): WorkspaceApi {
    const basePath = process.env.NEXT_PUBLIC_API_URL;
    if (!basePath) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const config = new Configuration({
        basePath,
        accessToken: async () => session.access_token,
    });

    return new WorkspaceApi(config);
}
```

### .openapi-generator-ignore (update)
```
# OpenAPI Generator Ignore
# Generated by openapi-generator https://github.com/openapitools/openapi-generator

# Use this file to prevent files from being overwritten by the generator.
# The patterns follow closely to .gitignore or .dockerignore.

# Protect custom domain barrel directories from regeneration
# These directories contain re-exports and custom types
entity/**
block/**
workspace/**
user/**
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| openapi-typescript with manual fetch | openapi-generator-cli with typed API classes | This migration | Removes boilerplate, adds type-safe method calls |
| Service classes with fetch | Service classes wrapping generated API | This migration | Consistent error handling, less code |

**Deprecated/outdated:**
- Manual fetch patterns: Being replaced by generated API class method calls
- `lib/types/types.ts`: Will be replaced by domain barrels in Phase 2

## Open Questions

Things that couldn't be fully resolved:

1. **WorkflowApi factory**
   - What we know: WorkflowApi exists in generated types
   - What's unclear: No existing workflow service mentioned in requirements
   - Recommendation: Skip WorkflowApi factory unless explicitly needed

## Sources

### Primary (HIGH confidence)
- `/home/jared/dev/worktrees/riven-openapi/client/lib/api/entity-api.ts` - Existing factory pattern
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/runtime.ts` - Configuration class interface
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/BlockApi.ts` - Generated API class
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/UserApi.ts` - Generated API class
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/apis/WorkspaceApi.ts` - Generated API class
- `/home/jared/dev/worktrees/riven-openapi/client/lib/types/.openapi-generator-ignore` - Current ignore file
- [OpenAPI Generator Customization Docs](https://openapi-generator.tech/docs/customization/) - Official ignore file syntax

### Secondary (MEDIUM confidence)
- `/home/jared/dev/worktrees/riven-openapi/client/scripts/generate-types.sh` - Generation script
- `/home/jared/dev/worktrees/riven-openapi/client/lib/auth/index.ts` - Session type export

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, documented in package.json
- Architecture: HIGH - Existing factory pattern is clear and working
- Pitfalls: HIGH - Derived from actual code examination and OpenAPI Generator docs

**Research date:** 2025-01-25
**Valid until:** 2025-02-25 (stable patterns, unlikely to change)
