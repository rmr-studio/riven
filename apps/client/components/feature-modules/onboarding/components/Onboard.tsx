'use client';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Propless } from '@/lib/interfaces/interface';
import { FC } from 'react';
import { OnboardForm } from './OnboardForm';

export const Onboard: FC<Propless> = () => {
  return (
    <Sheet open={true} modal={true}>
      <SheetContent
        hideClose={true}
        side={'left'}
        className="flex w-full flex-col overflow-y-auto p-8 sm:max-w-none md:px-16 md:py-20 lg:w-2/3 lg:max-w-none xl:w-1/2"
      >
        <OnboardForm />
      </SheetContent>
    </Sheet>
  );
};
