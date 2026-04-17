'use client';

import { useDeleteInsightsSession } from '@/components/feature-modules/knowledge-base/chat/hooks/mutation/use-delete-insights-session.mutation';
import { useInsightsSessions } from '@/components/feature-modules/knowledge-base/chat/hooks/query/use-insights-sessions';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Button } from '@riven/ui';
import { cn } from '@/lib/util/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { InsightsChatSessionModel } from '@/lib/types';
import { Plus } from 'lucide-react';

dayjs.extend(relativeTime);

interface ChatSessionListProps {
  workspaceId: string;
  activeSessionId: string | null;
  onSelect: (session: InsightsChatSessionModel | null) => void;
  onNew: () => void;
}

export const ChatSessionList = ({
  workspaceId,
  activeSessionId,
  onSelect,
  onNew,
}: ChatSessionListProps) => {
  const { data, isPending } = useInsightsSessions(workspaceId);
  const { mutate: deleteSession } = useDeleteInsightsSession(workspaceId);

  const sessions = data?.content ?? [];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border">
      <header className="flex items-center justify-between px-4 py-4">
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Conversations
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onNew}
          aria-label="New conversation"
        >
          <Plus className="size-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isPending && (
          <div className="px-4 py-3 text-xs text-muted-foreground">Loading…</div>
        )}

        {!isPending && sessions.length === 0 && (
          <div className="px-4 py-3 text-xs text-muted-foreground">
            No conversations yet.
          </div>
        )}

        <ul className="flex flex-col">
          {sessions.map((s) => (
            <ContextMenu key={s.id}>
              <ContextMenuTrigger asChild>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelect(s)}
                    className={cn(
                      'group flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors',
                      activeSessionId === s.id
                        ? 'border-foreground bg-muted'
                        : 'border-transparent hover:bg-muted/60',
                    )}
                  >
                    <span className="truncate text-sm font-medium text-heading">
                      {s.title || 'Untitled conversation'}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {s.lastMessageAt
                        ? dayjs(s.lastMessageAt).fromNow()
                        : 'Empty'}
                    </span>
                  </button>
                </li>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (activeSessionId === s.id) onSelect(null);
                    deleteSession(s.id);
                  }}
                >
                  Delete conversation
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </ul>
      </div>
    </aside>
  );
};
