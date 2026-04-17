'use client';

import {
  useChatActions,
  useSession,
} from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import {
  insightsSessionKeys,
} from '@/components/feature-modules/knowledge-base/chat/hooks/query/use-insights-sessions';
import { useInsightsMessages } from '@/components/feature-modules/knowledge-base/chat/hooks/query/use-insights-messages';
import { InsightsChatSessionModel } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

interface UseActiveSessionSyncArgs {
  workspaceId: string;
  activeSession: InsightsChatSessionModel | null;
  onSessionCreated: (session: InsightsChatSessionModel) => void;
}

/**
 * Bridges the (local) active-session selection to the store:
 *  - When a session is picked, load its messages and hydrate the store.
 *  - When the store creates a session itself (first send from a new chat),
 *    surface that back to the outer component so the list can highlight it.
 */
export function useActiveSessionSync({
  workspaceId,
  activeSession,
  onSessionCreated,
}: UseActiveSessionSyncArgs) {
  const queryClient = useQueryClient();
  const { hydrate, resetSession } = useChatActions();
  const storeSession = useSession();

  const messagesQuery = useInsightsMessages(workspaceId, activeSession?.id ?? null);

  const hydratedForRef = useRef<string | null>(null);

  // Hydrate when messages load for the selected session.
  useEffect(() => {
    if (!activeSession) return;
    if (!messagesQuery.data) return;
    if (hydratedForRef.current === activeSession.id) return;
    hydrate(activeSession, messagesQuery.data);
    hydratedForRef.current = activeSession.id;
  }, [activeSession, messagesQuery.data, hydrate]);

  // Clear the store when the user opens a brand-new conversation.
  useEffect(() => {
    if (activeSession === null) {
      resetSession();
      hydratedForRef.current = null;
    }
  }, [activeSession, resetSession]);

  // When the store creates a session (first send), notify the parent and
  // refresh the list so the new conversation appears.
  useEffect(() => {
    if (!storeSession) return;
    if (activeSession?.id === storeSession.id) return;
    onSessionCreated(storeSession);
    queryClient.invalidateQueries({ queryKey: insightsSessionKeys.all(workspaceId) });
    hydratedForRef.current = storeSession.id;
  }, [storeSession, activeSession, onSessionCreated, queryClient, workspaceId]);

  return {
    isLoadingMessages:
      !!activeSession && (messagesQuery.isPending || messagesQuery.isLoadingAuth),
  };
}
