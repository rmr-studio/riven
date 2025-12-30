import { IconColour, IconType } from "@/lib/types/types";
import { z } from "zod";

export const iconFormSchema = z.object({
    icon: z.object({
        icon: z.nativeEnum(IconType),
        colour: z.nativeEnum(IconColour),
    }),
});

export type IconFormValues = z.infer<typeof iconFormSchema>;
