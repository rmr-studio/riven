"use client";

import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useRef } from "react";
import { toast } from "sonner";
import type { WaitlistMultiStepFormData } from "@/lib/validations";
import { supabase } from "@/lib/supabase";

const PostgresErrorCode = {
  UniqueViolation: "23505",
} as const;

export function useWaitlistMutation() {
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: async (data: WaitlistMultiStepFormData): Promise<void> => {
      const { error } = await supabase
        .from("waitlist_submissions")
        .insert({
          name: data.name,
          email: data.email,
          operational_headache: data.operationalHeadache || null,
          integrations: data.integrations,
          monthly_price: data.monthlyPrice,
          involvement: data.involvement,
        });

      if (error) {
        if (error.code === PostgresErrorCode.UniqueViolation) {
          throw new Error("This email is already on the waitlist!");
        }
        throw new Error(error.message);
      }
    },
    onMutate: () => {
      toastRef.current = toast.loading("Joining waitlist...");
    },
    onSuccess: () => {
      toast.success("You're on the list! We'll be in touch.", {
        id: toastRef.current,
      });
    },
    onError: (error: Error) => {
      posthog.capture('waitlist_submission_failed', {
        error: error.message,
      });
      toast.error(error.message, { id: toastRef.current });
    },
  });
}
