'use client';

import { useProfile } from '@/components/feature-modules/user/hooks/use-profile';
import { FCWC, Propless } from '@/lib/interfaces/interface';
import { OnboardShell } from '../components/onboard-shell';

/**
 * Centralised Wrapper Component to Handle all the Onboarding Process
 *
 * Will handle the core onboarding with a mandatory flow for the user to complete
 *
 */
export const OnboardWrapper: FCWC<Propless> = ({ children }) => {
  const { data: user } = useProfile();

  if (user?.onboardingCompletedAt) return <>{children}</>;

  return <OnboardShell />;
};
