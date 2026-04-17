'use client';

import {
  useChatActions,
  useChatStatus,
} from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import { Button, Textarea } from '@riven/ui';
import { cn } from '@/lib/util/utils';
import { ArrowUp } from 'lucide-react';
import { KeyboardEvent, useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export const ChatInput = () => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { sendMessage } = useChatActions();
  const { hasPending } = useChatStatus();

  const disabled = hasPending || value.trim().length === 0;

  const submit = useCallback(async () => {
    const content = value.trim();
    if (!content || hasPending) return;
    setValue('');
    try {
      await sendMessage(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send';
      toast.error(message);
    }
  }, [value, hasPending, sendMessage]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="border-t border-border bg-card px-8 py-5">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            'flex items-end gap-3 rounded-md border border-border bg-background px-3 py-2 shadow-sm transition-colors',
            'focus-within:border-foreground/40',
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask the knowledge base…"
            rows={1}
            className="min-h-8 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed tracking-tight shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="icon"
            className="size-8 shrink-0"
            disabled={disabled}
            onClick={submit}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
            Enter to send · Shift+Enter for newline
          </span>
          {hasPending && (
            <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
              Thinking…
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
