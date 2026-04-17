'use client';

import { ChatCitations } from '@/components/feature-modules/knowledge-base/chat/components/chat-citations';
import { MessageContent } from '@/components/feature-modules/knowledge-base/chat/components/message-content';
import {
  useChatActions,
  useMessage,
} from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import { Button } from '@riven/ui';
import { cn } from '@/lib/util/utils';
import { InsightsMessageRole } from '@/lib/types';
import { AlertCircle, RotateCw } from 'lucide-react';
import { memo } from 'react';

interface ChatMessageProps {
  clientId: string;
}

export const ChatMessage = memo(({ clientId }: ChatMessageProps) => {
  const message = useMessage(clientId);
  const { retryMessage } = useChatActions();

  if (!message) return null;

  const isUser = message.role === InsightsMessageRole.User;
  const isPending = message.status === 'pending' || message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <article
      className={cn(
        'grid grid-cols-[4rem_1fr] gap-6 px-8 py-6',
        !isUser && 'border-b border-border/60',
      )}
    >
      <header className="pt-1">
        <span
          className={cn(
            'font-display text-[10px] font-bold uppercase tracking-widest',
            isUser ? 'text-muted-foreground' : 'text-heading',
          )}
        >
          {isUser ? 'You' : 'Riven'}
        </span>
      </header>

      <div className="min-w-0">
        {isPending ? (
          <PendingIndicator />
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed tracking-tight text-content">
            {message.content}
          </p>
        ) : (
          <MessageContent content={message.content} citations={message.citations} />
        )}

        {!isUser && !isPending && !isError && (
          <ChatCitations citations={message.citations} />
        )}

        {isError && (
          <div className="mt-3 flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex flex-1 flex-col gap-2">
              <span className="text-xs text-destructive">
                {message.error?.message ?? 'Something went wrong.'}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="w-fit gap-2"
                onClick={() => retryMessage(clientId)}
              >
                <RotateCw className="size-3" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
});

ChatMessage.displayName = 'ChatMessage';

const PendingIndicator = () => (
  <span
    aria-label="Riven is thinking"
    className="inline-flex items-center gap-1 font-display text-sm tracking-widest text-muted-foreground"
  >
    <span className="animate-pulse [animation-delay:0ms]">—</span>
    <span className="animate-pulse [animation-delay:180ms]">—</span>
    <span className="animate-pulse [animation-delay:360ms]">—</span>
  </span>
);
