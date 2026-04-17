'use client';

import { ChatMessage } from '@/components/feature-modules/knowledge-base/chat/components/chat-message';
import { useMessageIds } from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import { useEffect, useRef } from 'react';

export const ChatTranscript = () => {
  const ids = useMessageIds();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [ids.length]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col">
        {ids.map((id) => (
          <ChatMessage key={id} clientId={id} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
