if (typeof window !== 'undefined') {
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
    });
  });
}
