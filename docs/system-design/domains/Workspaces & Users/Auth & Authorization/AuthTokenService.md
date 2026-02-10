---
tags:
  - layer/service
  - component/active
  - architecture/component
Domains:
  - "[[Workspaces & Users]]"
Created: 2026-02-08
Updated: 2026-02-08
---
# AuthTokenService

Part of [[Auth & Authorization]]

## Purpose

Provides convenient JWT claim extraction for services that need the current user's identity. Wraps Spring SecurityContextHolder access with null-safety and proper exception handling.

---

## Responsibilities

- Extract user ID (UUID) from JWT `sub` claim
- Extract user email from JWT `email` claim
- Retrieve all JWT claims as a map
- List current user's granted authorities
- Throw AccessDeniedException when JWT is missing or claims are absent

---

## Dependencies

- Spring `SecurityContextHolder` — reads authentication context
- Spring OAuth2 `Jwt` — casts principal to Jwt for claim extraction

## Used By

- [[WorkspaceService]] — getUserId for workspace operations
- [[WorkspaceInviteService]] — getUserId and getUserEmail for invitation operations
- [[UserService]] — getUserId for session-based user retrieval
- [[WorkspaceSecurity]] — (indirectly, both read from SecurityContextHolder)

---

## Key Logic

**getJwt (private):**
- Extracts Authentication from SecurityContextHolder.getContext()
- Validates authentication is not null and principal is Jwt type
- Throws AccessDeniedException if no JWT present (not authenticated or not a Jwt principal)
- Returns Jwt instance

**getUserId:**
- Calls getJwt() to retrieve JWT
- Extracts `sub` claim from JWT claims map
- Validates claim is not null (throws AccessDeniedException if missing)
- Converts to UUID via UUID.fromString
- Throws IllegalArgumentException if string is not valid UUID format

**getUserEmail:**
- Calls getJwt() to retrieve JWT
- Extracts `email` claim from JWT claims map
- Validates claim is not null (throws AccessDeniedException if missing)
- Returns email as string

**getAllClaims:**
- Calls getJwt() to retrieve JWT
- Returns entire claims map
- Logs ALL claims at INFO level (line 60) — potential security concern

**getCurrentUserAuthorities:**
- Reads authentication from SecurityContextHolder
- Extracts authorities collection
- Maps GrantedAuthority instances to string list via `.authority` property
- Returns empty list if authentication is null

---

## Public Methods

### `getUserId(): UUID`

Extracts user ID from JWT `sub` claim. Throws AccessDeniedException if JWT missing or sub claim absent.

### `getUserEmail(): String`

Extracts email from JWT `email` claim. Throws AccessDeniedException if JWT missing or email claim absent.

### `getAllClaims(): Map<String, Any>`

Returns raw JWT claims map. Logs claims at INFO level.

### `getCurrentUserAuthorities(): Collection<String>`

Returns list of authority strings from current authentication. Empty list if not authenticated.

---

## Gotchas

- **Logging security concern:** getAllClaims logs ALL claims at INFO level (line 60) — may expose sensitive JWT data in production logs
- **No caching:** Every call goes through SecurityContextHolder — acceptable since SecurityContext is thread-local and request-scoped
- **String to UUID conversion:** getUserId uses UUID.fromString which throws IllegalArgumentException for malformed UUIDs — caller must handle
- **Null vs missing principal:** getJwt throws same AccessDeniedException whether authentication is null OR principal is not a Jwt — cannot distinguish between unauthenticated and wrong token type
- **Authority format dependency:** getCurrentUserAuthorities returns raw authority strings in ROLE_* and SCOPE_* format established by [[TokenDecoder]] — coupling to authority naming convention

---

## Related

- [[TokenDecoder]] — Converts JWT to authorities
- [[WorkspaceSecurity]] — Authorization logic consumer
- [[Auth & Authorization]] — Parent subdomain
