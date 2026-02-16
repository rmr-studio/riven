import { z } from "zod";

export const waitlistSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;

export const waitlistFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  feature: z.string().min(1, "Please select a feature"),
  integrations: z
    .array(z.string())
    .min(1, "Please select at least one integration"),
  monthlyPrice: z.string().min(1, "Please enter a price"),
  earlyTesting: z.string().min(1, "Please select an option"),
});

export type WaitlistMultiStepFormData = z.infer<typeof waitlistFormSchema>;
