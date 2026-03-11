'use client';

import { BGPattern } from '@/components/ui/background/grids';
import { Propless } from '@/lib/interfaces/interface';
import { FC } from 'react';
import { OnboardCameraCanvas } from './onboard-camera-canvas';

export const OnboardPreviewPanel: FC<Propless> = () => {
  return (
    <div className="relative h-full w-full">
      <BGPattern
        variant="dots"
        size={20}
        fill="var(--muted-foreground)"
        className="opacity-15"
        mask="none"
      />
      <OnboardCameraCanvas />
    </div>
  );
};
