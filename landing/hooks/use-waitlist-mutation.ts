"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef } from "react";
import type { WaitlistMultiStepFormData } from "@/lib/validations";

interface WaitlistResponse {
  success: boolean;
  message?: string;
}

export function useWaitlistMutation() {
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: async (
      data: WaitlistMultiStepFormData
    ): Promise<WaitlistResponse> => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to join waitlist");
      }

      return result;
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
      toast.error(error.message, { id: toastRef.current });
    },
  });
}
