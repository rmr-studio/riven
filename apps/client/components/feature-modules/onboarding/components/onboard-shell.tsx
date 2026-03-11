'use client';

import { Propless } from '@/lib/interfaces/interface';
import { FC } from 'react';
import { OnboardFormPanel } from './onboard-form-panel';
import { OnboardPreviewPanel } from './onboard-preview-panel';

export const OnboardShell: FC<Propless> = () => {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Left panel — form area (40%) */}
      <div className="bg-card h-full w-2/5">
        <OnboardFormPanel />
      </div>

      {/* Right panel — preview area (60%) */}
      <div className="bg-muted relative h-full w-3/5 overflow-hidden">
        <OnboardPreviewPanel />
      </div>
    </div>
  );
};
