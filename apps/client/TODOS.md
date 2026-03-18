# TODOS

Deferred work tracked from plan reviews and implementation decisions.

## NOTE Schema Type — Deferred Items

### Note Chip Hover Tooltip Preview
**Priority:** P2 | **Effort:** S | **Depends on:** NOTE feature shipped

When hovering a note chip in the data table cell, show a rich tooltip with the first ~150 words of the note rendered with formatting (bold, lists, headings). Gives instant context about note contents without opening the drawer for each one.

**Why:** As note count grows per entity, users need a fast way to scan contents without the open/close drawer round-trip. This is table-stakes for any chip-based UI that represents richer content underneath.

**How to apply:** Build a `NotePreviewTooltip` component that takes `Descendant[]` and renders a truncated read-only Slate view inside the existing shadcn `Tooltip`. Walk only the first N text nodes for the preview — don't serialize the full tree. The `TruncatedChipList` component wraps each chip with this tooltip.

---

### Full-Text Search Across Note Content
**Priority:** P2 | **Effort:** L | **Depends on:** NOTE feature + backend search infrastructure

Ability to search note content from the entity table search bar, surfacing entities whose notes contain matching text. Without this, notes become write-only as usage scales.

**Why:** The current `generateSearchConfigFromEntityType` only searches `STRING` attributes. Note content is nested Slate JSON — it can't be searched with the existing approach. Users will create dozens of notes and then have no way to find specific information.

**How to apply:** Backend needs to extract plaintext from Slate `Descendant[]` during entity save and populate a full-text search index (PostgreSQL `tsvector` on the extracted text, or a dedicated search column). Frontend adds NOTE attributes to the searchable columns list once the backend supports it. Consider a `extractPlainText(content: Descendant[]): string` utility shared between frontend (for preview) and backend (for indexing).

---

### @Mention Autocomplete Picker
**Priority:** P2 | **Effort:** M | **Depends on:** NOTE feature + EntityMention node type (defined in NOTE plan)

Build the autocomplete UI for entity cross-references within notes. When typing `@` in the note editor, show a dropdown that searches entities across the workspace. Selecting inserts an `EntityMention` inline Slate element that renders as a clickable chip linking to the referenced entity.

**Why:** Cross-referencing entities from notes creates a soft knowledge graph. A meeting note about an employee can reference their entity record, making notes navigable and contextually linked. This is the bridge between unstructured notes and structured entity data — core to Riven's value proposition.

**How to apply:** The `EntityMention` Slate node type is being defined as architecture prep in the NOTE feature (no UI yet). This TODO builds the interaction layer on top: a Slate plugin that intercepts `@` keystrokes, an entity search popover (reuse the existing entity search from `EntityRelationshipPicker`), and a render component for mention chips. The mention data model stores `{ entityId, entityTypeKey, label, icon }` in the Slate node.

---

### Note Templates
**Priority:** P3 | **Effort:** M | **Depends on:** NOTE feature

Pre-filled Slate content for common note types. When creating a new note, offer template options: "Blank", "Meeting Notes", "Action Items", "Follow-up". Templates provide pre-structured content with headings, checkboxes, and placeholder text.

**Why:** Users create the same types of notes repeatedly (weekly standup notes, client call summaries, onboarding checklists). Starting from a blank page every time creates unnecessary friction. Templates turn a 2-minute setup into a 5-second selection.

**How to apply:** Templates are `Descendant[]` presets — trivial to define given the Slate content model. Storage options: (a) workspace-level config stored via a new API endpoint, or (b) entity-type-level config stored in the entity type definition alongside schema properties. Start with a few hardcoded templates, then add user-created template management. The "New Note" button in the drawer becomes a split button: click for blank, dropdown for templates.
