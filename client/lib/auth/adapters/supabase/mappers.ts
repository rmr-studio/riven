/**
 * Type mapping functions for Supabase to domain type transformation.
 * These mappers provide a single source of truth for converting Supabase SDK types
 * to the provider-agnostic domain types defined in auth.types.ts.
 */

import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { Session, User, AuthChangeEvent } from '../../auth.types';

/**
 * Maps a Supabase Session to the domain Session type.
 * Omits refresh_token as it's managed internally by the adapter.
 *
 * @param supabaseSession - The Supabase session object
 * @returns Domain Session with access_token, expires_at, and mapped user
 */
export function mapSupabaseSession(supabaseSession: SupabaseSession): Session {
  return {
    access_token: supabaseSession.access_token,
    // Calculate from expires_in if expires_at is not provided
    expires_at:
      supabaseSession.expires_at ?? Math.floor(Date.now() / 1000) + supabaseSession.expires_in,
    user: mapSupabaseUser(supabaseSession.user),
  };
}

/**
 * Maps a Supabase User to the domain User type.
 * Preserves user_metadata in the metadata field.
 *
 * @param supabaseUser - The Supabase user object
 * @returns Domain User with id, email, and metadata
 */
export function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    metadata: supabaseUser.user_metadata ?? {},
  };
}

/**
 * Maps a Supabase auth state change event to the domain AuthChangeEvent type.
 * Returns null for events not in the domain type (INITIAL_SESSION, MFA events).
 *
 * @param event - The Supabase event string
 * @returns Domain AuthChangeEvent or null if event should be filtered
 */
export function mapAuthChangeEvent(event: string): AuthChangeEvent | null {
  switch (event) {
    case 'SIGNED_IN':
      return 'SIGNED_IN';
    case 'SIGNED_OUT':
      return 'SIGNED_OUT';
    case 'TOKEN_REFRESHED':
      return 'TOKEN_REFRESHED';
    case 'USER_UPDATED':
      return 'USER_UPDATED';
    case 'PASSWORD_RECOVERY':
      return 'PASSWORD_RECOVERY';
    case 'INITIAL_SESSION':
      return 'INITIAL_SESSION';
    default:
      // INITIAL_SESSION, MFA events, etc. are filtered
      return null;
  }
}
