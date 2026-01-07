// workspace.interface.ts
import { components, operations } from "@/lib/types/types";

// --- 🎯 Core Models ---
export type Workspace = components["schemas"]["Workspace"];
export type WorkspaceMember = components["schemas"]["WorkspaceMember"];
export type MembershipDetails = components["schemas"]["MembershipDetails"];
export type WorkspaceInvite = components["schemas"]["WorkspaceInvite"];
export type WorkspaceInviteStatus = components["schemas"]["WorkspaceInvite"]["status"];
export type WorkspacePlan = components["schemas"]["Workspace"]["plan"];
export type WorkspaceRole =
    components["schemas"]["WorkspaceMember"]["membershipDetails"]["role"];

// -- - 🔗 API Request Models ---
export type WorkspaceCreationRequest = components["schemas"]["WorkspaceCreationRequest"];

// --- 📦 Request Payloads ---
export type CreateWorkspaceRequest =
    operations["createWorkspace"]["requestBody"]["content"]["application/json"];
export type UpdateWorkspaceRequest =
    operations["updateWorkspace"]["requestBody"]["content"]["application/json"];
export type UpdateMemberRoleRequest =
    operations["updateMemberRole"]["requestBody"]["content"]["application/json"];
export type RemoveMemberFromWorkspaceRequest =
    operations["removeMemberFromWorkspace"]["requestBody"]["content"]["application/json"];
// Invites and deletions do not have request bodies

// --- 📬 Response Payloads ---
export type CreateWorkspaceResponse =
    operations["createWorkspace"]["responses"]["200"]["content"]["*/*"];
export type UpdateWorkspaceResponse =
    operations["updateWorkspace"]["responses"]["200"]["content"]["*/*"];
export type GetWorkspaceResponse =
    operations["getWorkspace"]["responses"]["200"]["content"]["*/*"];
export type UpdateMemberRoleResponse =
    operations["updateMemberRole"]["responses"]["200"]["content"]["*/*"];
export type InviteToWorkspaceResponse =
    operations["inviteToWorkspace"]["responses"]["200"]["content"]["*/*"];
export type GetWorkspaceInvitesResponse =
    operations["getWorkspaceInvites"]["responses"]["200"]["content"]["*/*"];
export type GetUserInvitesResponse =
    operations["getUserInvites"]["responses"]["200"]["content"]["*/*"];

// --- 📎 Path Parameters ---
export type GetWorkspacePathParams = operations["getWorkspace"]["parameters"]["path"];
export type DeleteWorkspacePathParams = operations["deleteWorkspace"]["parameters"]["path"];
export type UpdateMemberRolePathParams = operations["updateMemberRole"]["parameters"]["path"];
export type InviteToWorkspacePathParams =
    operations["inviteToWorkspace"]["parameters"]["path"];
export type RejectInvitePathParams = operations["rejectInvite"]["parameters"]["path"];
export type AcceptInvitePathParams = operations["acceptInvite"]["parameters"]["path"];
export type GetWorkspaceInvitesPathParams =
    operations["getWorkspaceInvites"]["parameters"]["path"];
export type RemoveMemberFromWorkspacePathParams =
    operations["removeMemberFromWorkspace"]["parameters"]["path"];
export type RevokeInvitePathParams = operations["revokeInvite"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
export type GetWorkspaceQueryParams = operations["getWorkspace"]["parameters"]["query"];
