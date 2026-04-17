'use client';

import { ChatEmptyState } from '@/components/feature-modules/knowledge-base/chat/components/chat-empty-state';
import { ChatInput } from '@/components/feature-modules/knowledge-base/chat/components/chat-input';
import { ChatSessionList } from '@/components/feature-modules/knowledge-base/chat/components/chat-session-list';
import { ChatTranscript } from '@/components/feature-modules/knowledge-base/chat/components/chat-transcript';
import { InsightsChatProvider } from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import { useMessageIds } from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import { useActiveSessionSync } from '@/components/feature-modules/knowledge-base/chat/hooks/use-active-session-sync';
import { useInsightsChatDeps } from '@/components/feature-modules/knowledge-base/chat/hooks/mutation/use-send-insights-message.mutation';
import { InsightsChatSessionModel } from '@/lib/types';
import { useState } from 'react';

interface KnowledgeBaseChatProps {
  workspaceId: string;
}

export const KnowledgeBaseChat = ({ workspaceId }: KnowledgeBaseChatProps) => {
  const deps = useInsightsChatDeps(workspaceId);

  return (
    <InsightsChatProvider workspaceId={workspaceId} deps={deps}>
      <KnowledgeBaseChatShell workspaceId={workspaceId} />
    </InsightsChatProvider>
  );
};

const KnowledgeBaseChatShell = ({ workspaceId }: { workspaceId: string }) => {
  const [activeSession, setActiveSession] = useState<InsightsChatSessionModel | null>(
    null,
  );

  const { isLoadingMessages } = useActiveSessionSync({
    workspaceId,
    activeSession,
    onSessionCreated: setActiveSession,
  });

  return (
    <section className="flex h-[calc(100dvh-12rem)] min-h-96 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <ChatSessionList
        workspaceId={workspaceId}
        activeSessionId={activeSession?.id ?? null}
        onSelect={setActiveSession}
        onNew={() => setActiveSession(null)}
      />

      <div className="flex flex-1 flex-col">
        <ChatPane isLoadingMessages={isLoadingMessages} />
        <ChatInput />
      </div>
    </section>
  );
};

const ChatPane = ({ isLoadingMessages }: { isLoadingMessages: boolean }) => {
  const ids = useMessageIds();

  if (isLoadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
          Loading conversation…
        </span>
      </div>
    );
  }

  if (ids.length === 0) {
    return <ChatEmptyState />;
  }

  return <ChatTranscript />;
};
