// workspace.interface.ts
import { components, operations } from '@/lib/types/types';

// --- 🎯 Core Models ---
export type Workspace = components['schemas']['Workspace'];
export type WorkspaceMember = components['schemas']['WorkspaceMember'];
export type WorkspaceInvite = components['schemas']['WorkspaceInvite'];
export type WorkspaceInviteStatus = components['schemas']['WorkspaceInvite']['status'];
export type WorkspacePlan = components['schemas']['Workspace']['plan'];

// -- - 🔗 API Request Models ---
export type SaveWorkspaceRequest = components['schemas']['SaveWorkspaceRequest'];

// --- 📎 Path Parameters ---
export type GetWorkspacePathParams = operations['getWorkspace']['parameters']['path'];
export type DeleteWorkspacePathParams = operations['deleteWorkspace']['parameters']['path'];
export type UpdateMemberRolePathParams = operations['updateMemberRole']['parameters']['path'];
export type InviteToWorkspacePathParams = operations['inviteToWorkspace']['parameters']['path'];
export type RejectInvitePathParams = operations['rejectInvite']['parameters']['path'];
export type AcceptInvitePathParams = operations['acceptInvite']['parameters']['path'];
export type GetWorkspaceInvitesPathParams = operations['getWorkspaceInvites']['parameters']['path'];
export type RemoveMemberFromWorkspacePathParams =
  operations['removeMemberFromWorkspace']['parameters']['path'];
export type RevokeInvitePathParams = operations['revokeInvite']['parameters']['path'];

// --- 🧮 Query Parameters ---
export type GetWorkspaceQueryParams = operations['getWorkspace']['parameters']['query'];
