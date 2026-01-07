import {
    CreateWorkspaceRequest,
    CreateWorkspaceResponse,
    GetWorkspaceInvitesPathParams,
    GetWorkspacePathParams,
    GetWorkspaceResponse,
    InviteToWorkspacePathParams,
    RevokeInvitePathParams,
    UpdateWorkspaceRequest,
} from "@/components/feature-modules/workspace/interface/workspace.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";
import { isUUID } from "validator";

export const createWorkspace = async (
    session: Session | null,
    request: CreateWorkspaceRequest,
    uploadedAvatar: Blob | null = null
): Promise<CreateWorkspaceResponse> => {
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

        const response = await fetch(`${url}/v1/workspace/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
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
                message: `Failed to create workspace: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }

        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const updateWorkspace = async (
    session: Session | null,
    request: UpdateWorkspaceRequest,
    uploadedAvatar: Blob | null = null
) => {
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

        const response = await fetch(`${url}/v1/workspace/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
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
                message: `Failed to update workspace: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }

        throw fromError(errorData);
    } catch (error) {
        if (isResponseError(error)) throw error;

        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const getWorkspace = async (
    session: Session | null,
    params: GetWorkspacePathParams,
    includeMetadata: boolean = false
): Promise<GetWorkspaceResponse> => {
    const { workspaceId } = params;
    try {
        // Validate id is a UUID
        if (!isUUID(workspaceId)) {
            throw fromError({
                message: "Invalid workspace ID format. Expected a UUID.",
                status: 400,
                error: "INVALID_ID",
            });
        }

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
            `${url}/v1/workspace/${workspaceId}?includeMetadata=${includeMetadata}`,
            {
                method: "GET",
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
                message: `Failed to fetch workspace: ${response.status} ${response.statusText}`,
                status: response.status,
                error: "SERVER_ERROR",
            };
        }

        throw fromError(errorData);
    } catch (error) {
        // Convert any caught error to ResponseError
        throw fromError(error);
    }
};

export const inviteToWorkspace = async (
    session: Session | null,
    params: InviteToWorkspacePathParams
) => {
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
};

export const getWorkspaceInvites = async (
    session: Session | null,
    params: GetWorkspaceInvitesPathParams
) => {
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
};

export const revokeInvite = async (session: Session | null, params: RevokeInvitePathParams) => {
    const { workspaceId, id } = params;
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
