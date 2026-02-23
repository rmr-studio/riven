import type { WaitlistMultiStepFormData } from '@/lib/validations';

export enum Step {
  CTA = 0,
  CONTACT = 1,
  OPERATIONAL_HEADACHE = 2,
  INTEGRATIONS = 3,
  PRICE = 4,
  INVOLVEMENT = 5,
  SUCCESS = 6,
}

export const TOTAL_FORM_STEPS = 5;

export const STEP_NAMES: Record<number, string> = {
  [Step.CTA]: 'cta',
  [Step.CONTACT]: 'contact',
  [Step.OPERATIONAL_HEADACHE]: 'operational_headache',
  [Step.INTEGRATIONS]: 'integrations',
  [Step.PRICE]: 'pricing',
  [Step.INVOLVEMENT]: 'involvement',
  [Step.SUCCESS]: 'success',
};

export const STEP_FIELDS: Partial<Record<Step, (keyof WaitlistMultiStepFormData)[]>> = {
  [Step.CONTACT]: ['name', 'email'],
  [Step.OPERATIONAL_HEADACHE]: ['operationalHeadache'],
  [Step.INTEGRATIONS]: ['integrations'],
  [Step.PRICE]: ['monthlyPrice'],
  [Step.INVOLVEMENT]: ['involvement'],
};

export const INPUT_CLASS =
  'w-full bg-transparent border-0 border-b border-foreground/20 pb-2 text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/50 transition-colors';

export const INPUT_ERROR_CLASS = 'border-destructive focus:border-destructive';
