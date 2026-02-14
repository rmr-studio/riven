import { cn } from '@/lib/utils';
import { FC, ReactNode } from 'react';

interface GlowBorderProps {
  children: ReactNode;
  className?: string;
}

export const GlowBorder: FC<GlowBorderProps> = ({ children, className }) => {
  return (
    <div className={cn('relative w-fit', className)}>
      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#38bdf8]/30 via-[#8b5cf6]/30 to-[#f43f5e]/30 blur-md" />
      <div
        className="relative"
        style={{
          boxShadow:
            '0 0 12px 2px rgba(139, 92, 246, 0.3), 0 0 4px 1px rgba(139, 92, 246, 0.2)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
