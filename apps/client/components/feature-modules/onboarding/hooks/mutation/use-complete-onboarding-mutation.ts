'use client';

import { useAuth } from '@/components/provider/auth-context';
import { CompleteOnboardingResponse } from '@/lib/types/models';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assemblePayload, OnboardingService } from '../../service/onboarding.service';
import { useOnboardStore, useOnboardSubmission } from '../use-onboard-store';

export function useCompleteOnboardingMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { setSubmissionStatus, setSubmissionResponse } = useOnboardSubmission();

  return useMutation<CompleteOnboardingResponse, Error, void>({
    mutationFn: async () => {
      const { validatedData, profileAvatarBlob, workspaceAvatarBlob } =
        useOnboardStore.getState();

      const request = assemblePayload(validatedData);

      return OnboardingService.completeOnboarding(
        session,
        request,
        profileAvatarBlob,
        workspaceAvatarBlob,
      );
    },
    onMutate: () => {
      setSubmissionStatus('loading');
    },
    onError: () => {
      setSubmissionStatus('error');
    },
    onSuccess: (response) => {
      setSubmissionResponse(response);
      setSubmissionStatus('success');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
