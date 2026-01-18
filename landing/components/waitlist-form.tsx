"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWaitlistMutation } from "@/hooks/use-waitlist-mutation";
import { waitlistSchema, type WaitlistFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function WaitlistForm({ className }: { className?: string }) {
  const { mutate, isPending, isSuccess } = useWaitlistMutation();

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const onSubmit = (data: WaitlistFormData) => {
    mutate(data);
  };

  // Success state - form is replaced with confirmation
  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-primary font-medium",
          className
        )}
      >
        <CheckCircle2 className="h-5 w-5" />
        <span>You're on the list! We'll be in touch.</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-3 sm:flex-row sm:gap-2", className)}
    >
      <div className="flex-1">
        <Input
          {...form.register("email")}
          type="email"
          placeholder="Enter your email"
          disabled={isPending}
          className={cn(
            "h-12",
            form.formState.errors.email && "border-destructive"
          )}
          aria-invalid={!!form.formState.errors.email}
          aria-describedby={
            form.formState.errors.email ? "email-error" : undefined
          }
        />
        {form.formState.errors.email && (
          <p id="email-error" className="mt-1 text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={isPending} className="h-12">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Join Waitlist"
        )}
      </Button>
    </form>
  );
}
