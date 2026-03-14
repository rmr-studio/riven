import { ONBOARD_STEPS } from '../config/onboard-steps';
import { CompleteOnboardingResponse } from '@/lib/types/models';
import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type SubmissionStatus = 'idle' | 'loading' | 'error' | 'success';

export interface OnboardState {
  currentStep: number;
  direction: 'forward' | 'backward';
  validatedData: Record<string, unknown>;
  liveData: Record<string, unknown>;
  formTrigger: (() => Promise<boolean>) | null;
  submissionStatus: SubmissionStatus;
  submissionResponse: CompleteOnboardingResponse | null;
  profileAvatarBlob: Blob | null;
  workspaceAvatarBlob: Blob | null;
}

export interface OnboardActions {
  goNext: () => void;
  goBack: () => void;
  skip: () => void;
  setStepData: (stepId: string, data: unknown) => void;
  setLiveData: (stepId: string, data: unknown) => void;
  registerFormTrigger: (fn: () => Promise<boolean>) => void;
  clearFormTrigger: () => void;
  setSubmissionStatus: (status: SubmissionStatus) => void;
  setSubmissionResponse: (response: CompleteOnboardingResponse) => void;
  setProfileAvatarBlob: (blob: Blob | null) => void;
  setWorkspaceAvatarBlob: (blob: Blob | null) => void;
  reset: () => void;
}

export type OnboardStore = OnboardState & OnboardActions;

const initialState: OnboardState = {
  currentStep: 0,
  direction: 'forward',
  validatedData: {},
  liveData: {},
  formTrigger: null,
  submissionStatus: 'idle',
  submissionResponse: null,
  profileAvatarBlob: null,
  workspaceAvatarBlob: null,
};

export const useOnboardStore = create<OnboardStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    goNext: () => {
      const { currentStep } = get();
      set({
        currentStep: Math.min(currentStep + 1, ONBOARD_STEPS.length - 1),
        direction: 'forward',
      });
    },

    goBack: () => {
      const { currentStep } = get();
      set({
        currentStep: Math.max(currentStep - 1, 0),
        direction: 'backward',
      });
    },

    skip: () => {
      const { currentStep } = get();
      const step = ONBOARD_STEPS[currentStep];
      if (step?.optional) {
        set({
          currentStep: Math.min(currentStep + 1, ONBOARD_STEPS.length - 1),
          direction: 'forward',
        });
      }
      // no-op if step is required
    },

    setStepData: (stepId, data) => {
      set((state) => ({
        validatedData: {
          ...state.validatedData,
          [stepId]: data,
        },
      }));
    },

    setLiveData: (stepId, data) => {
      set((state) => ({
        liveData: {
          ...state.liveData,
          [stepId]: data,
        },
      }));
    },

    registerFormTrigger: (fn) => {
      set({ formTrigger: fn });
    },

    clearFormTrigger: () => {
      set({ formTrigger: null });
    },

    setSubmissionStatus: (status) => {
      set({ submissionStatus: status });
    },

    setSubmissionResponse: (response) => {
      set({ submissionResponse: response });
    },

    setProfileAvatarBlob: (blob) => {
      set({ profileAvatarBlob: blob });
    },

    setWorkspaceAvatarBlob: (blob) => {
      set({ workspaceAvatarBlob: blob });
    },

    reset: () => {
      set({
        ...initialState,
        validatedData: {},
        liveData: {},
        formTrigger: null,
        submissionStatus: 'idle',
        submissionResponse: null,
        profileAvatarBlob: null,
        workspaceAvatarBlob: null,
      });
    },
  })),
);

// ── Selector hooks ───────────────────────────────────────────────────

export const useOnboardStepState = () =>
  useOnboardStore(useShallow((s) => ({ currentStep: s.currentStep, direction: s.direction })));

export const useOnboardLiveData = <T = unknown>(stepId: string) =>
  useOnboardStore((s) => s.liveData[stepId] as T | undefined);

export const useOnboardNavigation = () =>
  useOnboardStore(useShallow((s) => ({ goNext: s.goNext, goBack: s.goBack, skip: s.skip })));

export const useOnboardFormControls = () =>
  useOnboardStore(
    useShallow((s) => ({
      setLiveData: s.setLiveData,
      setStepData: s.setStepData,
      registerFormTrigger: s.registerFormTrigger,
      clearFormTrigger: s.clearFormTrigger,
    })),
  );

export const useOnboardSubmission = () =>
  useOnboardStore(
    useShallow((s) => ({
      submissionStatus: s.submissionStatus,
      submissionResponse: s.submissionResponse,
      setSubmissionStatus: s.setSubmissionStatus,
      setSubmissionResponse: s.setSubmissionResponse,
      reset: s.reset,
    })),
  );
