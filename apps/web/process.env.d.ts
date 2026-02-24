declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    /** Supabase project URL */
    NEXT_PUBLIC_SUPABASE_URL: string;
    /** Supabase anonymous/public key */
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    /** Canonical site URL for metadata/OG (e.g. https://getriven.io) */
    NEXT_PUBLIC_SITE_URL?: string;
    /** URL to the client/dashboard app (e.g. http://localhost:3001) */
    NEXT_PUBLIC_CLIENT_URL?: string;

    /** Enable/disable auth features ("true" | "false") */
    NEXT_PUBLIC_AUTH_ENABLED?: string;
    /** Optional: shared cookie domain for cross-app auth */
    NEXT_PUBLIC_COOKIE_DOMAIN?: string;

    /** PostHog analytics key */
    NEXT_PUBLIC_POSTHOG_KEY?: string;
    /** PostHog API host */
    NEXT_PUBLIC_POSTHOG_HOST?: string;

    /** CDN URL for static assets */
    NEXT_PUBLIC_CDN_URL?: string;
  }
}
