// test/types/workspace-user-barrel-verification.test.ts
// Verification that workspace and user domain barrels export correctly

// Workspace barrel imports
import type {
    Workspace,
    WorkspaceMember,
    WorkspaceInvite,
    SaveWorkspaceRequest,
    GetWorkspacePathParams,
    GetWorkspaceQueryParams,
    WorkspaceInviteStatusType,
} from "@/lib/types/workspace";

// User barrel imports
import type {
    User,
    UserDisplay,
    UpdateUserProfileRequest,
    GetCurrentUserResponse,
    GetUserByIdResponse,
    GetUserByIdPathParams,
} from "@/lib/types/user";

describe("Workspace and User barrel exports", () => {
    it("workspace barrel exports types correctly", () => {
        // Type-level checks - if this compiles, types work
        const checkWorkspace = (ws: Workspace) => ws.id;
        const checkMember = (m: WorkspaceMember) => m.user;
        const checkInvite = (i: WorkspaceInvite) => i.status;
        const checkRequest = (r: SaveWorkspaceRequest) => r.name;
        const checkPath = (p: GetWorkspacePathParams) => p.workspaceId;
        const checkQuery = (q: GetWorkspaceQueryParams) => q;
        const checkStatus = (s: WorkspaceInviteStatusType) => s;

        // Suppress unused variable warnings
        void checkWorkspace;
        void checkMember;
        void checkInvite;
        void checkRequest;
        void checkPath;
        void checkQuery;
        void checkStatus;

        expect(true).toBe(true);
    });

    it("user barrel exports types correctly", () => {
        // Type-level checks - if this compiles, types work
        const checkUser = (u: User) => u.id;
        const checkDisplay = (d: UserDisplay) => d.name;
        const checkRequest = (r: UpdateUserProfileRequest) => r;
        const checkResponse = (r: GetCurrentUserResponse) => r;
        const checkByIdResponse = (r: GetUserByIdResponse) => r;
        const checkPath = (p: GetUserByIdPathParams) => p.userId;

        // Suppress unused variable warnings
        void checkUser;
        void checkDisplay;
        void checkRequest;
        void checkResponse;
        void checkByIdResponse;
        void checkPath;

        expect(true).toBe(true);
    });
});
