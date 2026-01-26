import type { User } from "@/lib/types";
import { Session } from "@/lib/auth";
import { createUserApi } from "@/lib/api/user-api";
import { normalizeApiError, fromError } from "@/lib/util/error/error.util";

/**
 * Will fetch the Current authenticated user's detailed profile from the
 * active session token
 * @param {Session} session - The current active session for the user
 * @returns {User} - The user's profile
 */
export const fetchSessionUser = async (session: Session | null): Promise<User> => {
    try {
        // Validate session and access token
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

        const api = createUserApi(session);
        return await api.getCurrentUser();
    } catch (error) {
        throw await normalizeApiError(error);
    }
};

export const updateUser = async (
    session: Session | null,
    request: User,
    updatedAvatar?: Blob | null
): Promise<User> => {
    try {
        // Validate session and access token
        if (!session?.access_token) {
            throw fromError({
                message: "No active session found",
                status: 401,
                error: "NO_SESSION",
            });
        }

        const api = createUserApi(session);
        return await api.updateUserProfile({ user: request });
    } catch (error) {
        throw await normalizeApiError(error);
    }
};
