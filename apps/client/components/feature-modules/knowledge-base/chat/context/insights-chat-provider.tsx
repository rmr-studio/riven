'use client';

import {
  ChatMessage,
  createInsightsChatStore,
  InsightsChatStore,
  InsightsChatStoreApi,
  InsightsChatStoreDeps,
} from '@/components/feature-modules/knowledge-base/chat/stores/insights-chat.store';
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

const InsightsChatContext = createContext<InsightsChatStoreApi | undefined>(undefined);

export interface InsightsChatProviderProps {
  children: ReactNode;
  workspaceId: string;
  deps: InsightsChatStoreDeps;
}

export const InsightsChatProvider = ({
  children,
  workspaceId,
  deps,
}: InsightsChatProviderProps) => {
  const storeRef = useRef<InsightsChatStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createInsightsChatStore(workspaceId, deps);
  }

  return (
    <InsightsChatContext.Provider value={storeRef.current}>
      {children}
    </InsightsChatContext.Provider>
  );
};

const useInsightsChatStoreBase = <T,>(selector: (store: InsightsChatStore) => T): T => {
  const context = useContext(InsightsChatContext);
  if (!context) {
    throw new Error('useInsightsChatStore must be used within InsightsChatProvider');
  }
  return useStore(context, selector);
};

export const useInsightsChatStore = useInsightsChatStoreBase;

export const useMessageIds = (): string[] =>
  useInsightsChatStoreBase(useShallow((s) => s.messages.map((m) => m.clientId)));

export const useMessage = (clientId: string): ChatMessage | undefined =>
  useInsightsChatStoreBase((s) => s.messages.find((m) => m.clientId === clientId));

export const useSession = () => useInsightsChatStoreBase((s) => s.session);

export const useChatStatus = () => {
  const pendingClientId = useInsightsChatStoreBase((s) => s.pendingAssistantClientId);
  return { hasPending: pendingClientId !== null, pendingClientId };
};

export const useChatActions = () =>
  useInsightsChatStoreBase(
    useShallow((s) => ({
      sendMessage: s.sendMessage,
      retryMessage: s.retryMessage,
      resetSession: s.resetSession,
      hydrate: s.hydrate,
    })),
  );
