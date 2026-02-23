import { BlockApi, Configuration } from "@/lib/types";
import { Session } from "@/lib/auth";

/**
 * Creates a BlockApi instance configured with session-based authentication.
 * Uses NEXT_PUBLIC_API_URL for base path (without /api suffix - generated paths include it).
 *
 * @param session - Supabase session with access_token
 * @returns Configured BlockApi instance
 * @throws Error if session is invalid or API URL not configured
 */
export function createBlockApi(session: Session): BlockApi {
    const basePath = process.env.NEXT_PUBLIC_API_URL;
    if (!basePath) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const config = new Configuration({
        basePath,
        accessToken: async () => session.access_token,
    });

    return new BlockApi(config);
}
