'use server';

import * as React from 'react';
import { Resend } from 'resend';
import { WaitlistConfirmation } from '@/emails/waitlist-confirmation';

// Module-scope instantiation = fail-fast if API key is missing at startup
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(
  name: string,
  email: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Jared from Riven <jared@riven.software>',
      to: [email],
      subject: `Hey ${name} \u2014 you're on the Riven waitlist`,
      react: <WaitlistConfirmation name={name} />,
    });

    if (error) {
      console.error('[sendConfirmationEmail] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sendConfirmationEmail] Unexpected error:', message);
    return { success: false, error: message };
  }
}
