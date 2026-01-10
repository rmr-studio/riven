# Phase 4: Action Executors - Context

**Gathered:** 2026-01-10
**Status:** Ready for planning (plans already created)

<vision>
## How This Should Work

Action executors are **building blocks that snap together**. Each action (create entity, HTTP call, conditional branch) is a discrete, composable unit that workflows orchestrate. Think LEGO bricks, not monolithic scripts.

The key characteristic of good action blocks is **clear inputs and outputs**. Each action has well-defined inputs (entity ID, payload, URL, expression) and outputs (result data, error messages) - no surprises, no hidden state. When you look at an action node in a workflow, you should immediately understand what goes in and what comes out.

Beyond just entity CRUD and HTTP requests, this phase should establish an **extensible model for third-party integrations**. The `WorkflowActionNode` with `WorkflowActionType` enum should make it straightforward to add new action types (Slack messages, email sending, AI agent calls, etc.) in future phases.

</vision>

<essential>
## What Must Be Nailed

- **Extensibility pattern proven** - CRUD and HTTP actions implemented in a way that makes it obvious how to add Slack, email, AI agents, or any other integration later
- **Clear input/output contracts** - Every action has well-defined inputs and outputs with no surprises
- **Foundation for future integrations** - While we're not building Slack or email integrations in Phase 4, the pattern should make those additions straightforward

The most important outcome: When someone looks at how CRUD and HTTP actions are implemented, they should immediately understand how to add a new action type to `WorkflowActionType` and implement its executor.

</essential>

<boundaries>
## What's Out of Scope

- **Actual third-party integrations** - No Slack SDK, no email provider integrations, no AI agent calls - those come later once the pattern is proven with CRUD and HTTP
- **Integration registry/discovery system** - Keep it simple; extensibility comes from clear patterns, not complex infrastructure

Future phases will add specific integrations (Slack, email, AI agents) using the patterns established here.

</boundaries>

<specifics>
## Specific Ideas

**Existing architecture:**
- `WorkflowActionNode` interface with `WorkflowActionType` enum is already in place
- Action executors route based on enum values
- Config is polymorphic (different action types have different config structures)

**No strong preference on mechanism:**
- As long as adding a new action type is straightforward (add enum value, implement executor case, define config structure), the specific pattern (switch statement, strategy pattern, registry) is flexible
- Trust the implementation to use patterns consistent with the existing Kotlin/Spring Boot codebase

</specifics>

<notes>
## Additional Context

**Key insight:** This phase is as much about establishing patterns as it is about implementing specific actions. CRUD and HTTP are the "proof of concept" for an extensible action system.

**Success looks like:** A future developer (or Claude) can add a SEND_SLACK_MESSAGE action type by:
1. Adding `SEND_SLACK_MESSAGE` to `WorkflowActionType` enum
2. Creating a config data class for Slack message parameters
3. Implementing the executor case that calls Slack SDK
4. Testing it works

No framework changes, no architectural discussions - just follow the pattern.

</notes>

---

*Phase: 04-action-executors*
*Context gathered: 2026-01-10*
