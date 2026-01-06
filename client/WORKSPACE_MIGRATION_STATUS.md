# Organisation → Workspace Migration Status

**Date:** 2026-01-06
**Project:** Riven Client Frontend
**Migration Type:** Complete terminology change from "organisation" to "workspace"

---

## Executive Summary

A systematic migration from "organisation" to "workspace" terminology across the entire Riven frontend application. The backend has already been updated with new API paths (`/v1/workspace/`) and regenerated types in `lib/types/types.ts`.

**Progress:** ~40% Complete (Phases 1-3 of 7)
**Files Created:** 22 new workspace files
**Files Remaining:** ~65 files to update

---

## ✅ COMPLETED WORK (Phases 1-3)

### Phase 1: Core Type System & API Layer

#### 1.1 Type Interface ✅
**File Created:** `components/feature-modules/organisation/interface/workspace.interface.ts`

**Changes:**
- Re-exported all types from OpenAPI spec with workspace naming
- Type mappings:
  - `Organisation` → `Workspace`
  - `OrganisationMember` → `WorkspaceMember`
  - `OrganisationInvite` → `WorkspaceInvite`
  - `OrganisationRole` → `WorkspaceRole`
  - `CreateOrganisationRequest` → `CreateWorkspaceRequest`
  - `UpdateOrganisationRequest` → `UpdateWorkspaceRequest`
  - All path/query parameter types updated
  - 20+ total type exports updated

#### 1.2 API Service ✅
**File Created:** `components/feature-modules/organisation/service/workspace.service.ts`

**Changes:**
- Updated all API paths: `/v1/organisation/` → `/v1/workspace/`
- Updated all function parameters: `organisationId` → `workspaceId`
- Updated function names:
  - `createOrganisation` → `createWorkspace`
  - `updateOrganisation` → `updateWorkspace`
  - `getOrganisation` → `getWorkspace`
  - `inviteToOrganisation` → `inviteToWorkspace`
  - `getOrganisationInvites` → `getWorkspaceInvites`
  - `revokeInvite` (unchanged - generic function)
- Updated all error messages to reference "workspace"
- Updated all type references to use Workspace types

---

### Phase 2: State Management Layer

#### 2.1 Zustand Store ✅
**File Created:** `components/feature-modules/organisation/store/workspace.store.ts`

**Changes:**
- Renamed types:
  - `OrganisationStore` → `WorkspaceStore`
  - `OrganisationStoreApi` → `WorkspaceStoreApi`
  - `OrganisationState` → `WorkspaceState`
  - `OrganisationActions` → `WorkspaceActions`
- Renamed state properties:
  - `selectedOrganisationId` → `selectedWorkspaceId`
  - `setSelectedOrganisation` → `setSelectedWorkspace`
- Updated localStorage key: `"selectedOrganisation"` → `"selectedWorkspace"`
- Renamed factory: `createOrganisationStore` → `createWorkspaceStore`
- Updated imports to use `workspace.interface.ts`

#### 2.2 Context Provider ✅
**File Created:** `components/feature-modules/organisation/provider/workspace-provider.tsx`

**Changes:**
- Renamed component: `OrganisationsStoreProvider` → `WorkspacesStoreProvider`
- Renamed context: `OrganisationsStoreContext` → `WorkspacesStoreContext`
- Updated all internal references to use workspace terminology
- Updated user membership checks: `user.memberships[].organisation` → `user.memberships[].workspace`
- Exported hooks:
  - `useWorkspaceStore` (selector-based)
  - `useCurrentWorkspace` (full store access)

#### 2.3 Hooks ✅
**Files Created:**
1. `components/feature-modules/organisation/hooks/use-workspace.tsx`
2. `components/feature-modules/organisation/hooks/use-workspace-role.tsx`
3. `components/feature-modules/organisation/hooks/use-workspace-clients.tsx`

**Changes:**
- Renamed all hook functions
- Updated route parameter extraction: `{ organisationId }` → `{ workspaceId }`
- Updated query keys: `["organisation", id]` → `["workspace", id]`
- Updated service calls to use WorkspaceService
- Updated all type references
- Updated JSDoc comments to reference "workspace"

---

### Phase 3: Feature Module Components (16 Files)

#### 3.1 Form Components ✅
**Files Created:**
1. `components/feature-modules/organisation/components/form/1.workspace-details.tsx`
2. `components/feature-modules/organisation/components/form/2.workspace-billing.tsx`
3. `components/feature-modules/organisation/components/form/3.workspace-attributes.tsx`
4. `components/feature-modules/organisation/components/form/workspace-form.tsx`
5. `components/feature-modules/organisation/components/form/workspace-preview.tsx`

**Changes Applied:**
- Component names: `OrganisationXForm` → `WorkspaceXForm`
- Props: `organisationId` → `workspaceId`, `organisation` → `workspace`
- Form field labels: "Organisation" → "Workspace"
- Zod schema field names updated
- All imports updated to workspace modules
- User-facing text updated throughout

#### 3.2 Team/Member Components ✅
**Files Created:**
1. `components/feature-modules/organisation/components/team/workspace-table.tsx`
2. `components/feature-modules/organisation/components/team/workspace-invite-table.tsx`
3. `components/feature-modules/organisation/components/team/workspace-member-table.tsx`
4. `components/feature-modules/organisation/components/team/workspace-invite.tsx`
5. `components/feature-modules/organisation/components/team/workspace-members.tsx`

**Changes Applied:**
- Updated all type imports: `OrganisationMember` → `WorkspaceMember`, etc.
- Updated hook calls: `useOrganisationRole()` → `useWorkspaceRole()`
- Updated query invalidation keys
- Updated service calls for invitations
- Updated table column definitions
- All user-facing text updated

#### 3.3 Main Components ✅
**Files Created:**
1. `components/feature-modules/organisation/components/edit-workspace.tsx`
2. `components/feature-modules/organisation/components/new-workspace.tsx`
3. `components/feature-modules/organisation/components/workspace-card.tsx`

**Changes Applied:**
- Updated mutation hooks to use workspace service
- Updated navigation paths: `/dashboard/organisation/` → `/dashboard/workspace/`
- Updated breadcrumb trails
- Updated all props and state references
- Updated tile rendering logic for workspace data

#### 3.4 Dashboard Components ✅
**Files Created:**
1. `components/feature-modules/organisation/dashboard/workspace-analytics.tsx`
2. `components/feature-modules/organisation/dashboard/workspace-picker.tsx`
3. `components/feature-modules/organisation/dashboard/workspace-dashboard.tsx`

**Changes Applied:**
- Updated workspace picker to search workspaces
- Updated navigation links
- Updated breadcrumb logic
- All references to organisation data updated to workspace

---

## 🔄 REMAINING WORK (Phases 4-7)

### Phase 4: App Routes Migration (11 Files) - CRITICAL

**Directory Rename Required:**
```
FROM: app/dashboard/organisation/
TO:   app/dashboard/workspace/
```

**Dynamic Route Segment Rename:**
```
FROM: [organisationId]
TO:   [workspaceId]
```

#### Files to Update:

1. **`app/dashboard/organisation/page.tsx`**
   - Move to: `app/dashboard/workspace/page.tsx`
   - Update imports from workspace feature module
   - Update hook: `useOrganisation()` → `useWorkspace()`
   - Update navigation links

2. **`app/dashboard/organisation/new/page.tsx`**
   - Move to: `app/dashboard/workspace/new/page.tsx`
   - Update imports
   - Update redirect paths after creation

3. **`app/dashboard/organisation/[organisationId]/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/page.tsx`
   - Update params interface: `{ organisationId: string }` → `{ workspaceId: string }`
   - Update params destructuring throughout
   - Update all prop passing to components

4. **`app/dashboard/organisation/[organisationId]/edit/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/edit/page.tsx`
   - Update params
   - Update component imports and props

5. **`app/dashboard/organisation/[organisationId]/members/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/members/page.tsx`
   - Update params
   - Update component imports

6. **`app/dashboard/organisation/[organisationId]/subscriptions/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/subscriptions/page.tsx`
   - Update params
   - Update component imports

7. **`app/dashboard/organisation/[organisationId]/usage/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/usage/page.tsx`
   - Update params
   - Update component imports

8. **`app/dashboard/organisation/[organisationId]/entity/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/entity/page.tsx`
   - Update params (both organisationId → workspaceId)
   - Update entity component props

9. **`app/dashboard/organisation/[organisationId]/entity/[key]/page.tsx`**
   - Move to: `app/dashboard/workspace/[workspaceId]/entity/[key]/page.tsx`
   - Update params
   - Pass workspaceId to entity components

10. **`app/dashboard/organisation/[organisationId]/entity/[key]/settings/page.tsx`**
    - Move to: `app/dashboard/workspace/[workspaceId]/entity/[key]/settings/page.tsx`
    - Update params
    - Update all component props

11. **`app/dashboard/organisation/[organisationId]/entity/environment/page.tsx`**
    - Move to: `app/dashboard/workspace/[workspaceId]/entity/environment/page.tsx`
    - Update params
    - Update all component props

**Standard Pattern for All Route Files:**
```typescript
// BEFORE
interface PageProps {
    params: { organisationId: string };
}

export default async function Page({ params }: PageProps) {
    const { organisationId } = params;
    // ...
}

// AFTER
interface PageProps {
    params: { workspaceId: string };
}

export default async function Page({ params }: PageProps) {
    const { workspaceId } = params;
    // ...
}
```

---

### Phase 5: Dependent Feature Modules (~52 Files)

#### 5.1 Entity Module (24 Files)

**Service File:**
- `components/feature-modules/entity/service/entity-type.service.ts`
  - Update all method parameters: `organisationId` → `workspaceId`
  - Update API paths: `/organisations/${organisationId}/` → `/workspaces/${workspaceId}/`

**Hook Files (Query):**
- `components/feature-modules/entity/hooks/query/type/use-entity-types.ts`
- `components/feature-modules/entity/hooks/query/type/use-relationship-candidates.ts`
- `components/feature-modules/entity/hooks/query/use-entities.ts`

**Hook Files (Mutation):**
- `components/feature-modules/entity/hooks/mutation/type/use-publish-type-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-delete-type-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-save-configuration-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-delete-definition-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/type/use-save-definition-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/instance/use-save-entity-mutation.ts`
- `components/feature-modules/entity/hooks/mutation/instance/use-delete-entity-mutation.ts`

**Form Hook Files:**
- `components/feature-modules/entity/hooks/form/type/use-relationship-form.ts`
- `components/feature-modules/entity/hooks/form/type/use-new-type-form.ts`
- `components/feature-modules/entity/hooks/form/type/use-schema-form.ts`

**Component Files:**
- `components/feature-modules/entity/context/entity-provider.tsx`
- `components/feature-modules/entity/context/configuration-provider.tsx`
- `components/feature-modules/entity/stores/entity.store.ts`
- `components/feature-modules/entity/stores/type/configuration.store.ts`
- `components/feature-modules/entity/components/ui/entity-type-header.tsx`
- `components/feature-modules/entity/components/ui/modals/type/*.tsx` (3 files)
- `components/feature-modules/entity/components/ui/modals/instance/*.tsx` (1 file)
- `components/feature-modules/entity/components/tables/*.tsx` (3 files)
- `components/feature-modules/entity/components/types/*.tsx` (3 files)
- `components/feature-modules/entity/components/forms/type/**/*.tsx` (3 files)
- `components/feature-modules/entity/components/forms/instance/*.tsx` (1 file)
- `components/feature-modules/entity/components/dashboard/*.tsx` (3 files)

**Changes Required for Each File:**
- Update props: `organisationId: string` → `workspaceId: string`
- Update variable usage throughout
- Update service calls
- Update query keys: `["entityTypes", organisationId]` → `["entityTypes", workspaceId]`
- Update navigation links containing `/organisation/` → `/workspace/`

#### 5.2 Blocks Module (27 Files)

**Service Files:**
- `components/feature-modules/blocks/service/layout.service.ts`
- `components/feature-modules/blocks/service/block-type.service.ts`
- `components/feature-modules/blocks/service/block.service.ts`

**Hook Files:**
- `components/feature-modules/blocks/hooks/use-blocks-hydration.ts`
- `components/feature-modules/blocks/hooks/use-entity-references.tsx`
- `components/feature-modules/blocks/hooks/use-block-types.ts`
- `components/feature-modules/blocks/hooks/use-entity-layout.ts`
- `components/feature-modules/blocks/hooks/use-entity-selector.ts`

**Component Files:**
- `components/feature-modules/blocks/context/block-environment-provider.tsx`
- `components/feature-modules/blocks/context/block-hydration-provider.tsx`
- `components/feature-modules/blocks/context/layout-change-provider.tsx`
- `components/feature-modules/blocks/interface/editor.interface.ts`
- `components/feature-modules/blocks/util/environment/environment.util.ts`
- `components/feature-modules/blocks/util/block/factory/*.ts` (4 files)
- `components/feature-modules/blocks/components/panel/**/*.tsx` (4 files)
- `components/feature-modules/blocks/components/entity/*.tsx` (2 files)
- `components/feature-modules/blocks/components/render/**/*.tsx` (2 files)
- `components/feature-modules/blocks/components/modals/*.tsx` (1 file)
- `components/feature-modules/blocks/components/bespoke/*.tsx` (1 file)

**Changes Required:**
- Same pattern as Entity module
- Update all `organisationId` parameters
- Update service calls
- Update context providers that accept organisationId

#### 5.3 User Module (1 File)

**File:** `components/feature-modules/user/components/avatar-dropdown.tsx`

**Changes:**
- Update import: `useOrganisation` → `useWorkspace`
- Update hook call: `const { organisations } = useOrganisation()` → `const { workspaces } = useWorkspace()`
- Update variable references
- Update navigation paths: `/dashboard/organisation/` → `/dashboard/workspace/`

---

### Phase 6: Global Components (2 Files) - HIGH PRIORITY

#### 6.1 Dashboard Sidebar

**File:** `components/ui/sidebar/dashboard-sidebar.tsx`

**Current Issues:**
- Imports `Organisation` from organisation.interface (line 3)
- Uses `useOrganisationStore` (lines 4, 38-39)
- References `user.memberships[].organisation` (lines 48, 296)
- All navigation URLs use `/dashboard/organisation/` (lines 53, 59, 64, 82, 84, 107, 120, 154, 163, 178, etc.)
- User-facing text says "Organisation" (lines 58, 81, 238, 270, 279, 282, 293)

**Required Changes:**
```typescript
// Line 3: Update import
import { Workspace } from "@/components/feature-modules/organisation/interface/workspace.interface";

// Lines 4, 38-39: Update hook usage
import { useWorkspaceStore } from "@/components/feature-modules/organisation/provider/workspace-provider";

const selectedWorkspaceId = useWorkspaceStore((store) => store.selectedWorkspaceId);
const setSelectedWorkspace = useWorkspaceStore((store) => store.setSelectedWorkspace);

// Line 42: Update query
const { data: entityTypes, isLoading: isLoadingEntityTypes } =
    useEntityTypes(selectedWorkspaceId);

// Lines 47-49: Update selected workspace derivation
const selectedWorkspace =
    data?.memberships.find((m) => m.workspace?.id === selectedWorkspaceId)
        ?.workspace ?? null;

// Line 51-54: Update handler
const handleWorkspaceSelection = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    router.push("/dashboard/workspace/" + workspace.id);
};

// Lines 56-67: Update switcher options
const switcherOptions: Action[] = [
    {
        title: "Create Workspace",
        link: "/dashboard/workspace/new",
        icon: PlusCircle,
    },
    {
        title: "View All Workspaces",
        link: "/dashboard/workspace",
        icon: Building2,
    },
];

// Line 73: Update condition
const sidebarContent: SidebarGroupProps[] = selectedWorkspace
    ? [
        // ... rest of sidebar content
        // UPDATE ALL URLs from /organisation/ to /workspace/
        // UPDATE ALL references to selectedOrganisation to selectedWorkspace
      ]
    : [];

// Lines 256-303: Update header rendering
// Change all "Organisation" text to "Workspace"
// Update URLs
// Update variable references
```

**Full Find/Replace for This File:**
- Find: `/dashboard/organisation/` → Replace: `/dashboard/workspace/`
- Find: `selectedOrganisation` → Replace: `selectedWorkspace`
- Find: `Organisation` (in UI text) → Replace: `Workspace`
- Find: `organisation?.` → Replace: `workspace?.`
- Find: `useOrganisationStore` → Replace: `useWorkspaceStore`
- Find: `handleOrganisationSelection` → Replace: `handleWorkspaceSelection`

#### 6.2 Store Wrapper

**File:** `components/util/store.wrapper.tsx`

**Current Content:**
```typescript
import { FCWC, Propless } from "@/lib/interfaces/interface";
import { OrganisationsStoreProvider } from "../feature-modules/organisation/provider/organisation-provider";

const StoreProviderWrapper: FCWC<Propless> = ({ children }) => {
    return (
        <>
            <OrganisationsStoreProvider>{children}</OrganisationsStoreProvider>
        </>
    );
};

export default StoreProviderWrapper;
```

**Required Changes:**
```typescript
import { FCWC, Propless } from "@/lib/interfaces/interface";
import { WorkspacesStoreProvider } from "../feature-modules/organisation/provider/workspace-provider";

const StoreProviderWrapper: FCWC<Propless> = ({ children }) => {
    return (
        <>
            <WorkspacesStoreProvider>{children}</WorkspacesStoreProvider>
        </>
    );
};

export default StoreProviderWrapper;
```

---

### Phase 7: Verification & Cleanup

#### 7.1 Codebase Search for Remaining References

Run these searches to find any missed references:

```bash
# Search for organisation references (case-insensitive)
grep -ri "organisation" --include="*.ts" --include="*.tsx" client/ \
  | grep -v "node_modules" \
  | grep -v ".next"

# Search for old import paths
grep -r "feature-modules/organisation" --include="*.ts" --include="*.tsx" client/ \
  | grep -v "node_modules" \
  | grep -v ".next"

# Search for old route paths
grep -r '"/dashboard/organisation/' --include="*.ts" --include="*.tsx" client/ \
  | grep -v "node_modules" \
  | grep -v ".next"

# Search for organisationId parameters
grep -r "organisationId" --include="*.ts" --include="*.tsx" client/ \
  | grep -v "node_modules" \
  | grep -v ".next"

# Search for old query keys
grep -r '\["organisation"' --include="*.ts" --include="*.tsx" client/ \
  | grep -v "node_modules" \
  | grep -v ".next"
```

#### 7.2 TypeScript Compilation

```bash
cd /Users/jtucker/Github/riven/client
npm run build
```

**Expected Errors:**
- Import errors for old organisation paths
- Type errors where organisationId is still referenced
- Missing workspace types where organisation types were used

Fix all compilation errors before proceeding.

#### 7.3 Directory Rename

**After confirming all imports are updated:**

```bash
# Rename the feature module directory
mv components/feature-modules/organisation components/feature-modules/workspace

# This will break any remaining old imports - fix them!
```

#### 7.4 LocalStorage Cleanup

**Document for Users (Clean Break - No Migration):**

The migration uses new localStorage keys. Old workspace selections will be lost. Users will need to:
1. Re-select their workspace on first login after deployment
2. Clear old localStorage keys manually if desired

**Old Keys (No Longer Used):**
- `selectedOrganisation` - stored workspace ID

**New Keys:**
- `selectedWorkspace` - stores workspace ID

**Optional Cleanup Script for Users:**
```javascript
// Run in browser console to clean up old keys
localStorage.removeItem('selectedOrganisation');
// Note: Any draft keys with format "organisation-*" will also be orphaned
```

#### 7.5 Manual Testing Checklist

Test these critical user flows:

- [ ] **Login & Workspace Selection**
  - Login with existing account
  - Workspace picker displays correctly
  - Can select a workspace
  - Selection persists in localStorage

- [ ] **Workspace Creation**
  - Navigate to /dashboard/workspace/new
  - Form displays correctly
  - Can create new workspace
  - Redirects to workspace list after creation
  - New workspace appears in picker

- [ ] **Workspace Dashboard**
  - Navigate to workspace dashboard
  - Breadcrumbs show correct path
  - Sidebar loads workspace data
  - Entity types display correctly

- [ ] **Workspace Settings**
  - Edit workspace page loads
  - Form pre-populates with workspace data
  - Can save changes
  - Changes reflect immediately

- [ ] **Members Page**
  - Members table loads
  - Can invite new member
  - Invitations table loads
  - Can manage member roles

- [ ] **Entity Types with Workspace Context**
  - Entity types page loads
  - Can create entity type
  - Entity type configuration works
  - Workspace ID passed correctly to all APIs

- [ ] **Block Builder with Workspace Context**
  - Block builder loads
  - Workspace context available
  - Can create/edit blocks

- [ ] **Workspace Switching**
  - Can switch between workspaces
  - Sidebar updates with new workspace data
  - URL updates to new workspace ID
  - Entity types refresh for new workspace

- [ ] **Navigation**
  - All sidebar links work
  - All breadcrumbs work
  - All internal navigation maintains workspace context

#### 7.6 File Cleanup

**After confirming everything works:**

```bash
cd /Users/jtucker/Github/riven/client/components/feature-modules/organisation

# Remove old organisation files (DO NOT do this until migration is 100% complete!)
rm interface/organisation.interface.ts
rm service/organisation.service.ts
rm store/organisation.store.ts
rm provider/organisation-provider.tsx
rm hooks/use-organisation.tsx
rm hooks/use-organisation-role.tsx
rm hooks/use-organisation-clients.tsx

# Remove old component files
rm components/form/1.organisation-*.tsx
rm components/form/2.organisation-*.tsx
rm components/form/3.organisation-*.tsx
rm components/form/organisation-*.tsx
rm components/team/organisation-*.tsx
rm components/edit-organisation.tsx
rm components/new-organisation.tsx
rm components/organisation-card.tsx
rm dashboard/organisation-*.tsx
```

---

## 📋 QUICK REFERENCE: Search & Replace Patterns

Use these patterns carefully with your IDE's find/replace:

### Type Names
```
Organisation(?!Id) → Workspace
OrganisationId → WorkspaceId
organisationId → workspaceId
```

### API Paths
```
/v1/organisation/ → /v1/workspace/
/api/organisations/ → /api/workspaces/
```

### Route Paths
```
/dashboard/organisation/ → /dashboard/workspace/
[organisationId] → [workspaceId]
```

### Query Keys
```
["organisation"] → ["workspace"]
["organisationMember"] → ["workspaceMember"]
["organisationInvite"] → ["workspaceInvite"]
```

### Hook Names
```
useOrganisation → useWorkspace
useOrganisationRole → useWorkspaceRole
useOrganisationClients → useWorkspaceClients
useOrganisationStore → useWorkspaceStore
```

### Service Names
```
OrganisationService → WorkspaceService
createOrganisation → createWorkspace
updateOrganisation → updateWorkspace
getOrganisation → getWorkspace
inviteToOrganisation → inviteToWorkspace
```

### Store Names
```
OrganisationsStore → WorkspacesStore
OrganisationStoreApi → WorkspaceStoreApi
selectedOrganisationId → selectedWorkspaceId
setSelectedOrganisation → setSelectedWorkspace
```

### Provider Names
```
OrganisationsStoreProvider → WorkspacesStoreProvider
OrganisationsStoreContext → WorkspacesStoreContext
```

---

## ⚠️ CRITICAL GOTCHAS

### 1. Import Path Cascades
Renaming the feature module directory will break ~50+ import statements. Do this LAST after all other changes.

### 2. Props Drilling
Many components pass `organisationId` through multiple levels. Missing even one will cause runtime errors.

### 3. Query Key Consistency
Must update both query key definition AND invalidation sites. Missing invalidation will cause stale data.

### 4. Route Parameter Extraction
Every page component extracts `params.organisationId` - must update ALL of them.

### 5. Toast Messages
User-facing text should say "Workspace" not "Organisation". Check all toast.error/success calls.

### 6. Form Field Names
Zod schemas may have field names that need updating. Check carefully.

### 7. Navigation Links
Both `<Link href>` and `router.push()` calls need updating. Search for both patterns.

### 8. Store Selectors
Any place using `useOrganisationStore` with selector functions needs updating.

### 9. Context Consumers
Components using `useContext(OrganisationsStoreContext)` directly need updating (rare).

### 10. LocalStorage Keys
Won't be backwards compatible - document this for users.

### 11. User Membership Structure
Backend changed from `user.memberships[].organisation` to `user.memberships[].workspace` - update ALL references.

### 12. Service File Structure
The old files used exported functions, not a class. The new workspace.service.ts follows the same pattern.

---

## 📁 FILE LOCATIONS

### New Files Created (DO USE)
```
components/feature-modules/organisation/
├── interface/
│   └── workspace.interface.ts ✅
├── service/
│   └── workspace.service.ts ✅
├── store/
│   └── workspace.store.ts ✅
├── provider/
│   └── workspace-provider.tsx ✅
├── hooks/
│   ├── use-workspace.tsx ✅
│   ├── use-workspace-role.tsx ✅
│   └── use-workspace-clients.tsx ✅
├── components/
│   ├── form/
│   │   ├── 1.workspace-details.tsx ✅
│   │   ├── 2.workspace-billing.tsx ✅
│   │   ├── 3.workspace-attributes.tsx ✅
│   │   ├── workspace-form.tsx ✅
│   │   └── workspace-preview.tsx ✅
│   ├── team/
│   │   ├── workspace-table.tsx ✅
│   │   ├── workspace-invite-table.tsx ✅
│   │   ├── workspace-member-table.tsx ✅
│   │   ├── workspace-invite.tsx ✅
│   │   └── workspace-members.tsx ✅
│   ├── edit-workspace.tsx ✅
│   ├── new-workspace.tsx ✅
│   └── workspace-card.tsx ✅
└── dashboard/
    ├── workspace-analytics.tsx ✅
    ├── workspace-picker.tsx ✅
    └── workspace-dashboard.tsx ✅
```

### Old Files (DO NOT USE - Delete After Migration)
```
components/feature-modules/organisation/
├── interface/
│   └── organisation.interface.ts ❌
├── service/
│   └── organisation.service.ts ❌
├── store/
│   └── organisation.store.ts ❌
├── provider/
│   └── organisation-provider.tsx ❌
└── hooks/
    ├── use-organisation.tsx ❌
    ├── use-organisation-role.tsx ❌
    └── use-organisation-clients.tsx ❌
(+ all organisation-*.tsx component files)
```

---

## 🚀 RECOMMENDED EXECUTION STRATEGY

### Option A: Systematic Manual Migration
1. Complete Phase 4 (Routes) - ~1 hour
2. Complete Phase 5 (Dependent Modules) - ~2-3 hours
3. Complete Phase 6 (Global Components) - ~15 minutes
4. Complete Phase 7 (Verification) - ~30 minutes
5. Test thoroughly
6. Deploy

**Total Estimated Time:** 4-5 hours

### Option B: Use Claude to Complete
1. Resume this conversation
2. Ask Claude to complete Phases 4-7
3. Claude will create/update remaining files
4. You verify and test
5. Deploy

**Total Estimated Time:** 1-2 hours (mostly testing)

### Option C: Hybrid Approach
1. Complete high-risk files manually (Routes, Sidebar)
2. Use find/replace for repetitive changes (Entity/Blocks modules)
3. Use Claude for verification
4. Test thoroughly
5. Deploy

**Total Estimated Time:** 2-3 hours

---

## 📊 MIGRATION METRICS

| Category | Total Files | Completed | Remaining | % Complete |
|----------|-------------|-----------|-----------|------------|
| Core (Interface, Service, Store) | 5 | 5 | 0 | 100% |
| Hooks | 3 | 3 | 0 | 100% |
| Components | 16 | 16 | 0 | 100% |
| Routes | 11 | 0 | 11 | 0% |
| Entity Module | 24 | 0 | 24 | 0% |
| Blocks Module | 27 | 0 | 27 | 0% |
| User Module | 1 | 0 | 1 | 0% |
| Global Components | 2 | 0 | 2 | 0% |
| **TOTAL** | **89** | **24** | **65** | **~27%** |

---

## 🆘 TROUBLESHOOTING

### Build Errors After Migration

**Error:** `Cannot find module '@/components/feature-modules/organisation/...'`
- **Cause:** Import still references old organisation path
- **Fix:** Update import to use workspace path

**Error:** `Property 'organisationId' does not exist on type...`
- **Cause:** Component props still use organisationId
- **Fix:** Update prop definition and all references

**Error:** `Type 'Organisation' is not assignable to type 'Workspace'`
- **Cause:** Variable or function using old type
- **Fix:** Update type annotation

### Runtime Errors

**Error:** `useOrganisationStore must be used within OrganisationsStoreProvider`
- **Cause:** Component using old hook before provider is updated
- **Fix:** Update store.wrapper.tsx to use WorkspacesStoreProvider

**Error:** API calls returning 404
- **Cause:** Still calling old `/organisations/` endpoints
- **Fix:** Update service calls to use workspace service

**Error:** Navigation not working
- **Cause:** Links still point to `/dashboard/organisation/`
- **Fix:** Update all navigation links and router.push calls

### Data Issues

**Issue:** Workspace selection not persisting
- **Cause:** localStorage key mismatch
- **Fix:** Clear old localStorage, select workspace again

**Issue:** Wrong workspace data loading
- **Cause:** Query key not updated
- **Fix:** Update query key to use "workspace" instead of "organisation"

---

## 📞 SUPPORT

If you encounter issues:

1. **Check the plan file:** `/Users/jtucker/.claude/plans/warm-stargazing-lynx.md`
2. **Search for remaining references:** Use grep commands in Phase 7.1
3. **Check TypeScript errors:** Run `npm run build`
4. **Resume Claude conversation:** Provide specific error messages

---

**Document Version:** 1.0
**Last Updated:** 2026-01-06
**Migration Status:** ~27% Complete (Phases 1-3 of 7)
