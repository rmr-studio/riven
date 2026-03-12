'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@riven/ui/input';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { useAuth } from '@/components/provider/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useOnboardStore } from '../../hooks/use-onboard-store';

export const profileStepSchema = z.object({
  displayName: z
    .string({ required_error: 'Display name is required' })
    .min(3, 'Must be at least 3 characters'),
});

export type ProfileStepData = z.infer<typeof profileStepSchema>;

interface ProfileLiveData {
  displayName?: string;
  avatarPreviewUrl?: string;
}

export const ProfileStepForm: FC = () => {
  const { user } = useAuth();
  const setLiveData = useOnboardStore((s) => s.setLiveData);
  const registerFormTrigger = useOnboardStore((s) => s.registerFormTrigger);
  const clearFormTrigger = useOnboardStore((s) => s.clearFormTrigger);
  const restoredData = useOnboardStore(
    (s) => s.liveData['profile'] as ProfileLiveData | undefined,
  );

  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | undefined>(
    restoredData?.avatarPreviewUrl,
  );

  const form = useForm<ProfileStepData>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: {
      displayName:
        restoredData?.displayName ??
        (user?.metadata?.full_name as string | undefined) ??
        (user?.metadata?.name as string | undefined) ??
        '',
    },
  });

  // Register form trigger on mount so nav controls can call form.trigger()
  useEffect(() => {
    registerFormTrigger(() => form.trigger());
    return () => clearFormTrigger();
  }, [form, registerFormTrigger, clearFormTrigger]);

  // Fire initial liveData so preview shows pre-populated data immediately
  useEffect(() => {
    const values = form.getValues();
    setLiveData('profile', { ...values, avatarPreviewUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch subscription: keep liveData in sync as user types
  useEffect(() => {
    const sub = form.watch((values) => {
      setLiveData('profile', { ...values, avatarPreviewUrl });
    });
    return () => sub.unsubscribe();
  }, [form, setLiveData, avatarPreviewUrl]);

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarUpload = (file: Blob) => {
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setAvatarBlob(file);
    setAvatarPreviewUrl(url);
    setLiveData('profile', { ...form.getValues(), avatarPreviewUrl: url });
  };

  const handleAvatarRemove = () => {
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarBlob(null);
    setAvatarPreviewUrl(undefined);
    setLiveData('profile', { ...form.getValues(), avatarPreviewUrl: undefined });
  };

  // Suppress unused variable warning for avatarBlob
  void avatarBlob;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6">
        <AvatarUploader
          onUpload={handleAvatarUpload}
          onRemove={avatarPreviewUrl ? handleAvatarRemove : undefined}
          imageURL={avatarPreviewUrl}
          title="Profile picture"
          validation={{
            maxSize: 2 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            errorMessage: 'Please upload a JPEG, PNG, or GIF under 2MB.',
          }}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
