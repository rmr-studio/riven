# Riven Client - Codebase Summary

## 1. Project Overview

Riven is a Next.js-based SaaS platform for entity and content management with dynamic schema configuration. It provides multi-tenant organization support, a flexible block-based content system with drag-and-drop layouts, and sophisticated entity type management with customizable attributes and bidirectional relationships.

## 2. Tech Stack

**Core:**
- Next.js 15.3.4 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (Radix primitives)

**State Management:**
- Zustand 5.0.8 (client state, stores)
- TanStack Query 5.81.2 (server state, caching, mutations)
- React Hook Form 7.58.1 + Zod 3.25.67 (forms & validation)

**Key Dependencies:**
- Gridstack 12.3.3 (drag-and-drop grid layouts)
- XYFlow 12.10.0 (node-based UI/graphs)
- Framer Motion 12.23.24 (animations)
- Supabase 2.50.0 (auth & backend)
- OpenAPI TypeScript 7.8.0 (type generation)

**Dev Tools:**
- Jest 29.7.0 + Testing Library
- ESLint + Docker

## 3. Architecture

### Directory Structure

```
client/
├── app/                                    # Next.js App Router (file-based routing)
│   ├── api/                               # API routes
│   ├── dashboard/
│   │   └── organisation/[organisationId]/  # Org-scoped routes
│   │       ├── entity/[key]/              # Dynamic entity type routes
│   │       ├── members/
│   │       └── subscriptions/
│   └── layout.tsx                         # Root layout with providers
│
├── components/
│   ├── feature-modules/                   # Core feature modules (domain-driven)
│   │   ├── blocks/                        # Block system (69 components)
│   │   ├── entity/                        # Entity system (23 components)
│   │   ├── authentication/
│   │   ├── organisation/
│   │   └── [other features]/
│   ├── ui/                                # shadcn/ui components (70+ files)
│   └── provider/                          # Global providers
│
├── lib/
│   ├── types/                             # OpenAPI-generated TypeScript types
│   ├── interfaces/                        # Shared type definitions
│   └── util/                              # Shared utilities
│
├── stores/                                # Global Zustand stores
└── hooks/                                 # Global custom hooks
```

### Feature Module Pattern

**Every feature module follows this structure:**

```
feature-name/
├── components/          # UI components
│   ├── forms/          # Form components
│   ├── modals/         # Modal dialogs
│   ├── tables/         # Data tables
│   └── ui/             # UI elements
├── config/             # Configuration constants
├── context/            # React Context providers
├── hooks/              # Custom hooks
│   ├── form/          # Form hooks
│   ├── mutation/      # TanStack mutation hooks
│   └── query/         # TanStack query hooks
├── interface/          # TypeScript interfaces (re-exports OpenAPI types)
├── service/            # API client services (static classes)
├── stores/             # Zustand stores (scoped state)
└── util/               # Feature-specific utilities
```

**Key modules:**
- **blocks/** - Flexible content composition with drag-and-drop grid layouts, nested block hierarchies, entity references, form widgets, portal-based rendering
- **entity/** - Dynamic schema management with attributes, bidirectional relationships, cardinality constraints, impact analysis, auto-save configuration forms

## 4. Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm run types        # Generate TypeScript types from OpenAPI (http://localhost:8081/docs/v3/api-docs)
```

## 5. Code Conventions

### Naming

**Files:**
- Components: `kebab-case.tsx` (e.g., `entity-type-header.tsx`)
- Utilities: `kebab-case.util.ts`
- Services: `kebab-case.service.ts`
- Hooks: `use-kebab-case.ts`
- Stores: `kebab-case.store.ts`
- Interfaces: `kebab-case.interface.ts`

**Code:**
- Components: `PascalCase`
- Hooks: `use{Name}` prefix
- Props interfaces: `{ComponentName}Props`
- Types/Interfaces: `PascalCase`

### Common Patterns

#### 1. Type Safety with OpenAPI

```typescript
// lib/types/types.ts - generated from OpenAPI spec
import { components } from "@/lib/types/types";

// feature-modules/entity/interface/entity.interface.ts - semantic re-exports
export type EntityType = components["schemas"]["EntityType"];
export type EntityRelationshipDefinition = components["schemas"]["EntityRelationshipDefinition"];
```

**Always use re-exported types from feature interfaces, never import directly from lib/types.**

#### 2. Service Layer (Static Classes)

```typescript
export class EntityTypeService {
    static async getEntityTypes(
        session: Session | null,
        organisationId: string
    ): Promise<EntityType[]> {
        validateSession(session);
        validateUuid(organisationId);

        const response = await fetch(`/api/organisations/${organisationId}/entity-types`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (response.ok) return await response.json();
        throw await handleError(response, (res) => `Failed to fetch: ${res.status}`);
    }
}
```

**Pattern:**
- Static methods for all service operations
- Always validate session and UUIDs first
- Use `handleError` utility for consistent error handling
- Return typed responses from OpenAPI schemas

#### 3. TanStack Query Hooks

```typescript
export function useSaveDefinitionMutation(
    organisationId: string,
    options?: UseMutationOptions<EntityTypeImpactResponse, Error, SaveTypeDefinitionRequest>
) {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const submissionToastRef = useRef<string | number | undefined>(undefined);

    return useMutation({
        mutationFn: (definition) =>
            EntityTypeService.saveEntityTypeDefinition(session, organisationId, definition),
        onMutate: () => {
            submissionToastRef.current = toast.loading("Saving...");
        },
        onSuccess: (response) => {
            toast.success("Saved successfully!", { id: submissionToastRef.current });
            queryClient.setQueryData(["entityType", organisationId, response.key], response);
        },
        onError: (error) => {
            toast.error(`Failed: ${error.message}`, { id: submissionToastRef.current });
        },
        ...options,
    });
}
```

**Pattern:**
- Encapsulate mutation logic with toast notifications
- Update/invalidate cache on success
- Toast refs for loading → success/error transitions
- Allow options override for custom behavior

#### 4. Zustand Stores with Context

```typescript
// Store factory for per-instance stores
export const createEntityTypeConfigStore = (
    entityTypeKey: string,
    organisationId: string,
    entityType: EntityType,
    form: UseFormReturn<EntityTypeFormValues>,
    updateMutation: (type: EntityType) => Promise<EntityType>
) => {
    return create<EntityTypeConfigStore>()(
        subscribeWithSelector((set, get) => ({
            isDirty: false,
            draftValues: null,

            setDirty: (isDirty) => set({ isDirty }),
            saveDraft: (values) => {
                const storageKey = `entity-type-draft-${organisationId}-${entityTypeKey}`;
                localStorage.setItem(storageKey, JSON.stringify({
                    values,
                    timestamp: Date.now()
                }));
                set({ draftValues: values });
            },
        }))
    );
};

// Provider injects store into context
export const EntityTypeConfigurationProvider = ({ children, ...props }) => {
    const storeRef = useRef<EntityTypeConfigStoreApi | null>(null);

    if (!storeRef.current) {
        storeRef.current = createEntityTypeConfigStore(...);
    }

    return (
        <EntityTypeConfigContext.Provider value={storeRef.current}>
            {children}
        </EntityTypeConfigContext.Provider>
    );
};

// Hook with selector for accessing store
export const useEntityTypeConfigurationStore = <T,>(
    selector: (store: EntityTypeConfigStore) => T
): T => {
    const context = useContext(EntityTypeConfigContext);
    return useStore(context, selector);
};
```

**Pattern:**
- Factory function creates scoped store instances
- Provider wraps components needing access
- Selector-based hooks for performance
- `subscribeWithSelector` enables fine-grained subscriptions
- Store refs in provider prevent recreation

#### 5. React Hook Form + Auto-save

```typescript
const form = useForm<EntityTypeFormValues>({
    resolver: zodResolver(entityTypeFormSchema),
    defaultValues: { /* ... */ },
});

// Auto-save effect (common pattern)
useEffect(() => {
    const subscription = form.watch((values) => {
        const timeoutId = setTimeout(() => {
            store.saveDraft(values);
        }, 1000); // Debounce 1 second

        return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
}, [form, store]);

// Draft restoration on mount
useEffect(() => {
    const draft = store.getDraft();
    if (draft && !isStale(draft.timestamp)) {
        form.reset(draft.values);
        toast.info("Restored unsaved changes");
    }
}, []);
```

**Pattern:**
- Zod schema validation
- Auto-save with 1-second debounce
- Draft persistence to localStorage
- Restoration prompt on mount
- Draft staleness check (usually 7 days)

#### 6. Portal-Based Rendering (Blocks)

```typescript
export const RenderElementProvider: FC<ProviderProps> = ({ wrapElement }) => {
    const { getWidgetContainer } = useContainer();

    return (
        <>
            {Array.from(environment.widgetMetaMap.entries()).map(([widgetId, meta]) => {
                const container = getWidgetContainer(widgetId);
                const rendered = generateRenderedComponent(node, meta, nodeData);

                return (
                    <RenderElementContext.Provider key={widgetId} value={{...}}>
                        {createPortal(
                            <PortalContentWrapper widgetId={widgetId}>
                                {rendered}
                            </PortalContentWrapper>,
                            container
                        )}
                    </RenderElementContext.Provider>
                );
            })}
        </>
    );
};
```

**Pattern:**
- React portals render content into grid containers
- Each widget has isolated context
- Container management via hooks
- Gridstack integration for positioning

#### 7. Type Guards & Discriminated Unions

```typescript
export const isContentMetadata = (
    payload: Block["payload"]
): payload is BlockContentMetadata =>
    payload?.type === BlockMetadataType.CONTENT;

// Usage with type narrowing
if (isContentMetadata(node.block.payload)) {
    // TypeScript knows payload is BlockContentMetadata
    const config = node.block.payload.listConfig;
}
```

**Always use type guards for discriminated unions, never type assertions.**

#### 8. Error Handling

```typescript
// Centralized error utilities (lib/util/error/)
export async function handleError(
    response: Response,
    message: (response: Response) => string
): Promise<ResponseError> {
    let errorData;
    try {
        errorData = await response.json();
    } catch {
        errorData = {
            message: message(response),
            status: response.status,
            error: "SERVER_ERROR",
        };
    }
    return fromError(errorData);
}

// Usage in services
if (response.ok) return await response.json();
throw await handleError(response, (res) => `Failed: ${res.status} ${res.statusText}`);
```

**Pattern:**
- Always use `handleError` for fetch responses
- Provide context-specific error messages
- Let errors propagate to mutation hooks
- Display errors via toast notifications

## 6. Key Domain Concepts

### Entity Type System

**Dynamic schema management** for custom business objects:

**Entity Types:**
- User-defined schemas (e.g., Client, Project, Invoice)
- Custom attributes with validation
- Bidirectional relationships with cardinality constraints
- Icon, color, and identifier key configuration

**Attributes:**
- UUID-based with SchemaUUID references
- Data types: string, number, boolean, date, enum
- Constraints: required, unique, min/max length
- Protected attributes (cannot be deleted)

**Relationships:**
- Bidirectional with automatic inverse creation
- Cardinality: ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY
- Polymorphic (multiple target types)
- Overlap detection prevents conflicts

**Configuration Flow:**
1. Define entity type (name, icon, description)
2. Add/edit attributes with validation rules
3. Configure relationships with target types
4. System analyzes impact of changes
5. User confirms understanding of impact
6. Changes applied atomically

**Critical Features:**
- **Auto-save:** Form changes saved to localStorage every 1 second
- **Draft Management:** Drafts expire after 7 days, restoration offered on mount
- **Impact Analysis:** Server performs dry-run before schema changes
- **Dirty Tracking:** Visual indicators show unsaved changes

### Block System

**Flexible content composition** framework:

**Blocks:**
- Fundamental content units with type definitions
- Content blocks (user data) or reference blocks (entity/block references)
- Support nested children based on type configuration
- Grid-based positioning with drag-and-drop

**Block Metadata Types:**
1. **Content:** User-entered data, form-based editing, list configuration
2. **Entity Reference:** References to entity instances with hydration
3. **Block Reference:** References to reusable block trees

**Rendering Flow:**
1. **Environment Setup:** Grid initialization, widget registration, layout history
2. **Hydration:** Resolve entity references, fetch block trees, merge data
3. **Rendering:** Portal-based rendering to grid containers, component structure from definitions, dynamic binding resolution
4. **Editing:** Inline/drawer editing, draft management, auto-resize
5. **Layout:** Drag-and-drop reorganization, history tracking (undo/redo)

**Form Widget System:**
Registry pattern for input types (text, email, phone, dropdown, file upload, etc.):

```typescript
export const formWidgetRegistry: Record<string, WidgetMetadata> = {
    text_input: { component: TextInputWidget, defaultValue: "" },
    dropdown: { component: DropdownWidget, defaultValue: null },
    // ...
};

const Widget = formWidgetRegistry[fieldConfig.type].component;
```

### Relationship Overlap Detection

**Advanced conflict resolution** for entity relationships:

```typescript
interface RelationshipOverlap {
    existingRelationship: EntityRelationshipDefinition;
    newRelationship: EntityRelationshipDefinition;
    conflictType: "INVERSE_EXISTS" | "DUPLICATE" | "CARDINALITY_CONFLICT";
}
```

**Detection Logic:**
1. Check existing relationships with same target
2. Analyze cardinality compatibility
3. Detect inverse relationship conflicts
4. Suggest resolution strategies (merge, replace, separate)

### Impact Analysis Pattern

**Used throughout entity management:**

```typescript
interface EntityTypeImpactResponse {
    success: boolean;
    updatedEntityTypes?: Record<string, EntityType>;
    affectedEntities?: number;
    warnings?: string[];
}
```

**Flow:**
1. User initiates schema change
2. Server performs dry-run analysis
3. Returns 409 if impact detected
4. Frontend displays impact details
5. User confirms understanding
6. Server applies with `impactConfirmed=true`

### Multi-tenancy

**Organisation-scoped resources:**
- All major features scoped to organisation ID
- Route pattern: `/dashboard/organisation/[organisationId]/{feature}`
- Entity types, blocks, members isolated per org
- Subscription and usage tracking per org

## Development Gotchas

1. **Never import types directly from `lib/types/types.ts`** - Always use re-exported types from feature interfaces
2. **Auto-save is 1 second debounced** - Don't add additional debouncing in form components
3. **Draft storage keys must be unique** - Include both organisationId and entity key
4. **Impact confirmation required** - Schema changes need `impactConfirmed=true` after showing impact
5. **Portal rendering requires containers** - Gridstack must be initialized before rendering widgets
6. **Store factories are per-instance** - Never reuse store instances across different entities
7. **Session validation is critical** - Always call `validateSession()` before API calls
8. **Type guards over assertions** - Use type guard functions, not `as` casts
9. **OpenAPI types regenerate** - Run `npm run types` after backend schema changes
10. **Client components need directive** - Add `"use client"` when using hooks/browser APIs

## Common Tasks

**Add a new entity attribute:**
1. Create form field in `entity-type-attributes-form.tsx`
2. Update Zod schema with validation
3. Add to form default values
4. Handle in save mutation

**Add a new form widget (blocks):**
1. Create widget component in `components/feature-modules/blocks/components/forms/widgets/`
2. Register in `formWidgetRegistry` with default value
3. Add type to widget type enum
4. Update render logic if needed

**Add a new entity relationship:**
1. Use relationship form in entity configuration
2. Select target type and cardinality
3. Review overlap detection results
4. Confirm impact analysis
5. System creates inverse automatically

**Create a new feature module:**
1. Create directory in `components/feature-modules/`
2. Add subdirectories: `components/`, `hooks/`, `interface/`, `service/`, `util/`
3. Create interface file with OpenAPI type re-exports
4. Create service class with static methods
5. Create query/mutation hooks
6. Add UI components

## Maintenance

When making significant changes:
- **New dependencies:** Update Tech Stack section
- **Architectural shifts:** Update Architecture section
- **New conventions:** Update Code Conventions section
- **Domain changes:** Update Key Domain Concepts section
- **New gotchas:** Add to Development Gotchas section

Keep this file accurate and concise - it's a reference for AI assistants and new developers.
