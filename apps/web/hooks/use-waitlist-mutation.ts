"use client";

import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useRef } from "react";
import { toast } from "sonner";
import type { WaitlistJoinData, WaitlistSurveyData } from "@/lib/validations";
import { createClient } from "@/lib/supabase";

const PostgresErrorCode = {
  UniqueViolation: "23505",
} as const;

export function useWaitlistJoinMutation() {
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: async (data: WaitlistJoinData): Promise<void> => {
      const { error } = await createClient()
        .from("waitlist_submissions")
        .insert({
          name: data.name,
          email: data.email,
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
      toast.success("You're on the list!", {
        id: toastRef.current,
      });
    },
    onError: (error: Error) => {
      posthog.capture("waitlist_join_failed", {
        error: error.message,
      });
      toast.error(error.message, { id: toastRef.current });
    },
  });
}

export function useWaitlistUpdateMutation() {
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: async (
      data: WaitlistSurveyData & { email: string },
    ): Promise<void> => {
      const { error } = await createClient()
        .from("waitlist_submissions")
        .update({
          operational_headache: data.operationalHeadache || null,
          integrations: data.integrations,
          monthly_price: data.monthlyPrice,
          involvement: data.involvement,
        })
        .eq("email", data.email);

      if (error) {
        throw new Error(error.message);
      }
    },
    onMutate: () => {
      toastRef.current = toast.loading("Saving your preferences...");
    },
    onSuccess: () => {
      toast.success("Thanks for the extra detail!", {
        id: toastRef.current,
      });
    },
    onError: (error: Error) => {
      posthog.capture("waitlist_survey_failed", {
        error: error.message,
      });
      toast.error("Something went wrong, but you're still on the list!", {
        id: toastRef.current,
      });
    },
  });
}
