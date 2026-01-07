import type {
    GetWorkspaceInvitesPathParams,
    InviteToWorkspacePathParams,
    RevokeInvitePathParams,
    SaveWorkspaceRequest,
    Workspace,
    WorkspaceMember,
} from "@/components/feature-modules/workspace/interface/workspace.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

export class WorkspaceService {
    static async saveWorkspace(
        session: Session | null,
        request: SaveWorkspaceRequest,
        uploadedAvatar: Blob | null = null
    ): Promise<Workspace> {
        try {
            validateSession(session);
            const url = api();

            const formData = new FormData();

            // JSON request part
            formData.append(
                "workspace",
                new Blob([JSON.stringify(request)], { type: "application/json" })
            );

            // Optional file part
            if (uploadedAvatar) {
                formData.append("file", uploadedAvatar);
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: formData,
            });

            if (response.ok) {
                return await response.json();
            }

            // A payload of validation errors and impact errors are also returned with 400 and 409 status codes
            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to create entity instance: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async inviteToWorkspace(session: Session | null, params: InviteToWorkspacePathParams) {
        const { workspaceId, email, role } = params;
        try {
            // Validate session and access token
            if (!session?.access_token) {
                throw fromError({
                    message: "No active session found",
                    status: 401,
                    error: "NO_SESSION",
                });
            }

            const url = api();
            const response = await fetch(
                `${url}/v1/workspace/invite/workspace/${workspaceId}/email/${email}/role/${role}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            if (response.ok) {
                return await response.json();
            }

            // Parse server error response
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = {
                    message: `Failed to invite user: ${response.status} ${response.statusText}`,
                    status: response.status,
                    error: "SERVER_ERROR",
                };
            }

            throw fromError(errorData);
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async getWorkspaceInvites(
        session: Session | null,
        params: GetWorkspaceInvitesPathParams
    ) {
        const { workspaceId } = params;
        try {
            // Validate session and access token
            if (!session?.access_token) {
                throw fromError({
                    message: "No active session found",
                    status: 401,
                    error: "NO_SESSION",
                });
            }

            const url = api();
            const response = await fetch(`${url}/v1/workspace/invite/workspace/${workspaceId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }

            // Parse server error response
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = {
                    message: `Failed to fetch workspace invites: ${response.status} ${response.statusText}`,
                    status: response.status,
                    error: "SERVER_ERROR",
                };
            }

            throw fromError(errorData);
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    revokeInvite = async (session: Session | null, params: RevokeInvitePathParams) => {
        const { workspaceId, id } = params;
        try {
            validateSession(session);
            validateUuid(workspaceId);
            validateUuid(id);

            const url = api();
            const response = await fetch(
                `${url}/v1/workspace/invite/workspace/${workspaceId}/invitation/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            if (response.ok) {
                return true;
            }

            // Parse server error response
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = {
                    message: `Failed to revoke invite: ${response.status} ${response.statusText}`,
                    status: response.status,
                    error: "SERVER_ERROR",
                };
            }

            throw fromError(errorData);
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    };

    static async getWorkspace(session: Session | null, workspaceId: string): Promise<Workspace> {
        try {
            validateSession(session);
            validateUuid(workspaceId);

            const url = api();
            const response = await fetch(`${url}/v1/workspace/${workspaceId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            // A payload of validation errors and impact errors are also returned with 400 and 409 status codes
            if (response.ok) return await response.json();
            throw await handleError(
                response,
                (res) => `Failed to create entity instance: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async getWorkspaceMembers(
        session: Session | null,
        workspaceId: string
    ): Promise<WorkspaceMember[]> {
        try {
            validateSession(session);
            validateUuid(workspaceId);

            const url = api();
            const response = await fetch(`${url}/v1/workspace/${workspaceId}/members`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            // A payload of validation errors and impact errors are also returned with 400 and 409 status codes
            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to create entity instance: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }
}
