import { IconColour, IconType } from '@/lib/types/common';
import { z } from 'zod';

export const iconFormSchema = z.object({
  icon: z.object({
    type: z.nativeEnum(IconType),
    colour: z.nativeEnum(IconColour),
  }),
});

export type IconFormValues = z.infer<typeof iconFormSchema>;
