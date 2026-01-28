/**
 * Auth provider factory.
 * Creates and caches the configured auth provider instance based on environment variables.
 */

import { AuthProvider } from "./auth-provider.interface";
import { SupabaseAuthAdapter } from "./adapters/supabase/supabase-adapter";

/** Cached provider instance (singleton) */
let cachedProvider: AuthProvider | null = null;

/**
 * Creates or returns the cached auth provider instance.
 *
 * Reads NEXT_PUBLIC_AUTH_PROVIDER env var to determine which adapter to use.
 * Currently supports: "supabase"
 *
 * @returns The configured AuthProvider instance
 * @throws Error if AUTH_PROVIDER is not set or is an unknown value
 *
 * @example
 * ```typescript
 * const auth = createAuthProvider();
 * const session = await auth.getSession();
 * ```
 */
export function createAuthProvider(): AuthProvider {
    if (cachedProvider) {
        return cachedProvider;
    }

    const providerType = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

    if (!providerType) {
        throw new Error(
            "NEXT_PUBLIC_AUTH_PROVIDER environment variable is not set. Please set it to one of: supabase"
        );
    }

    switch (providerType) {
        case "supabase":
            cachedProvider = new SupabaseAuthAdapter();
            break;
        default:
            throw new Error(
                `Unknown auth provider: "${providerType}". Supported providers: supabase`
            );
    }

    return cachedProvider;
}
