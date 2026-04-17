# Insights Chat Demo — Smoke Test

Manual end-to-end verification for the insights chat demo feature. Runs the full
create-session → chat → follow-up → history → delete loop against a local backend.

## Prerequisites

Required environment variables (the app will fail to start without these):

- `POSTGRES_DB_JDBC` — JDBC URL for a reachable Postgres, e.g. `jdbc:postgresql://localhost:5432/riven`
- `JWT_SECRET_KEY` — HMAC secret used to verify Supabase JWTs
- `JWT_AUTH_URL` — Supabase auth issuer URL
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_KEY` — Supabase service key
- `SERVER_PORT` — e.g. `8080`
- `ORIGIN_API_URL` — e.g. `http://localhost:3000`
- `TEMPORAL_SERVER_ADDRESS` — e.g. `localhost:7233`
- `ANTHROPIC_API_KEY` — required for this feature; without it, `sendMessage` will 502

Optional but useful:

- `RATE_LIMIT_ENABLED=false` during testing
- `RIVEN_CREDENTIAL_ENCRYPTION_KEY` if connectors touch the happy path

## Boot

```bash
cd core
./gradlew bootRun
```

Wait for the banner + `Started CoreApplicationKt in N seconds`.

## Obtain a JWT

Sign in to the frontend (or any Supabase client) and copy the `access_token` from
local storage / the network panel of a request. Export it for the curl commands:

```bash
export JWT="eyJhbGciOi..."
export WORKSPACE_ID="<WORKSPACE_ID>"
export BASE="http://localhost:${SERVER_PORT:-8080}"
```

The user represented by the JWT must be a member of `WORKSPACE_ID` with a role
that passes `@workspaceSecurity.hasWorkspace(...)`.

## Exercise the endpoints

### 1. Create a session

```bash
curl -s -X POST "$BASE/api/v1/insights/workspace/$WORKSPACE_ID/sessions" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke test session"}' | tee /tmp/insights-session.json
```

Capture the session id:

```bash
export SESSION_ID=$(jq -r '.id' /tmp/insights-session.json)
```

### 2. Send the first message (lazily seeds the demo pool)

```bash
curl -s -X POST "$BASE/api/v1/insights/workspace/$WORKSPACE_ID/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message":"Which customers are most at risk of churn?"}' | tee /tmp/insights-reply-1.json
```

### 3. Follow-up in the same session

```bash
curl -s -X POST "$BASE/api/v1/insights/workspace/$WORKSPACE_ID/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"message":"Of those, which are on the Enterprise plan?"}' | tee /tmp/insights-reply-2.json
```

### 4. Fetch message history

```bash
curl -s "$BASE/api/v1/insights/workspace/$WORKSPACE_ID/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $JWT" | jq .
```

### 5. Delete the session (also cleans up the seeded demo pool)

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -X DELETE "$BASE/api/v1/insights/workspace/$WORKSPACE_ID/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $JWT"
# Expect 204
```

## What to eyeball

In `/tmp/insights-reply-*.json`:

- `content` — not empty, reads as a coherent answer.
- `citations[]` — non-empty, each entry has `entityId` (UUID), `entityType`,
  and `label`. Entity ids should be resolvable:

```bash
ENTITY_ID=$(jq -r '.citations[0].entityId' /tmp/insights-reply-1.json)
curl -s "$BASE/api/v1/entity/$ENTITY_ID" -H "Authorization: Bearer $JWT" | jq .
```

- `tokenUsage` — populated on the assistant reply. After turn 2, `cacheReadTokens`
  should be non-zero, proving the system prompt is being served from the Anthropic
  prompt cache (ephemeral cache_control is working).

On the server side:

- First `sendMessage` logs `Seeded insights demo pool for session ...` once.
- Subsequent calls do not re-seed — `demoPoolSeeded` flag gates it.
- `DELETE` logs `Cleaned up insights demo pool for session ...` with non-zero counts.

## Rollback

Calling `DELETE /sessions/$SESSION_ID` is sufficient — it soft-deletes the session,
all seeded entities, their attributes, relationships, and the identity clusters
tagged with that `demo_session_id`. No manual cleanup needed.

If the session cannot be deleted via the API for any reason, the demo rows can
also be cleaned up with:

```sql
UPDATE entities SET deleted = true, deleted_at = now()
  WHERE demo_session_id = '<SESSION_ID>';
UPDATE identity_clusters SET deleted = true, deleted_at = now()
  WHERE demo_session_id = '<SESSION_ID>';
UPDATE entity_attributes SET deleted = true, deleted_at = now()
  WHERE entity_id IN (SELECT id FROM entities WHERE demo_session_id = '<SESSION_ID>');
UPDATE entity_relationships SET deleted = true, deleted_at = now()
  WHERE source_entity_id IN (SELECT id FROM entities WHERE demo_session_id = '<SESSION_ID>')
     OR target_entity_id IN (SELECT id FROM entities WHERE demo_session_id = '<SESSION_ID>');
```

## Citation rendering contract (frontend)

As of 2026-04-15 the assistant emits citations **inline** within the answer text, not in a
separate `citations[]` array. The model is now instructed to use ONE markup form only:

```
[Human-readable label](entity:<uuid>)
```

The server derives the response's `citations[]` by parsing these markers, validating each
UUID against the seeded pool, and populating `entityType` from pool metadata. The
`citations[]` field stays on the API response (for analytics / API consumers) but the
prose is the source of truth — it always reflects what the user sees.

Defensive markdown stripping is performed server-side, so the answer the frontend receives
should be plain text plus inline entity links only (no `**bold**`, no `# headings`, no
bullet lists, no fenced code, no `> blockquotes`).

**Frontend rendering:** match this regex and replace each match with a clickable pill.

```
\[([^\]]+)\]\(entity:([0-9a-fA-F-]+)\)
```

No full markdown engine is required.

## Per-message demo augmentation (2026-04-15)

Each user message now spawns a small targeted seed pass in addition to the initial 20-customer/80-event pool. Before the main answer LLM runs, a lightweight planner call (`DemoAugmentationPlanner`) inspects the question plus the current pool summary and proposes up to 8 new customers and 30 new events that make the question answerable with credible, specific references. Those additions are applied by `DemoSeederService.applyAugmentationPlan` under hard server-side caps, tagged with `demo_session_id`, and the pool summary is rebuilt before the main LLM call so the new rows are citable. Planner and applier failures degrade gracefully — the message continues with the existing pool and a WARN is logged. Session deletion cleans up augmentation rows via the same `demo_session_id` path as the initial seed.
