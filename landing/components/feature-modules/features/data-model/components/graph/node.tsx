import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { FC } from 'react';
import { NodeModel } from '../../types';

interface Props {
  delay?: number;
  node: NodeModel;
}

// ── Card components ─────────────────────────────────────
export const PrimaryNode: FC<Props> = ({ node, delay = 0 }) => {
  const { id, title, attributes, moreCount, icon: Icon } = node;

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-64 rounded-lg border border-border bg-background shadow shadow-sm shadow-background"
    >
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-md p-1.5')}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
      </div>
      {attributes && moreCount && (
        <div className="space-y-1.5 px-3 py-2">
          {attributes?.map((attr, i) => {
            const { icon: AttributeIcon, title } = attr;
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AttributeIcon />
                <span>{title}</span>
              </div>
            );
          })}
          {moreCount && (
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground/60">
              <Plus className="h-3 w-3" />
              <span>{moreCount} More Attributes</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export const SecondaryNode: FC<Props> = ({ node, delay }) => {
  const { title, icon: Icon } = node;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-fit rounded-lg border border-primary bg-card-foreground px-3 py-2 shadow shadow-background"
    >
      <div className="flex items-center gap-2">
        <div className="rounded p-1">
          <Icon className="h-3 w-3 text-secondary" />
        </div>
        <span className="truncate text-xs font-medium text-secondary">{title}</span>
      </div>
    </motion.div>
  );
};
