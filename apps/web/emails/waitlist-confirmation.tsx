import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Tailwind,
  Container,
  Section,
  Img,
  Text,
  Button,
} from '@react-email/components';

interface WaitlistConfirmationProps {
  name: string;
}

export function WaitlistConfirmation({ name }: WaitlistConfirmationProps) {
  // Hardcoded fallback ensures template renders in all environments
  // NEXT_PUBLIC_CDN_URL is optional in env.ts — do NOT use validated env() here
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL ?? 'https://cdn.riven.software';

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You're on the Riven waitlist — we'll be in touch soon.</Preview>
      <Tailwind>
        <Body className="bg-teal-50 font-sans m-0 p-0">

          {/* Logo + wordmark — above the card */}
          <Section className="text-center pt-8 pb-4">
            <Img
              src={`${cdnBase}/images/email/logo.png`}
              width={120}
              height={40}
              alt="Riven"
              style={{ margin: '0 auto' }}
            />
          </Section>

          {/* White content card */}
          <Container className="bg-white rounded-xl mx-auto max-w-[560px] px-10 py-8">
            <Text className="text-2xl font-semibold text-gray-900 mt-0">
              Hey {name},
            </Text>
            <Text className="text-gray-600 text-base leading-relaxed">
              You're officially on the Riven waitlist. We're building something
              we think you'll love, and we can't wait to share it with you.
            </Text>
            <Text className="text-gray-600 text-base leading-relaxed">
              Follow along as we build — we post updates on Instagram.
            </Text>
            <Section className="text-center mt-6 mb-2">
              <Button
                href="https://www.instagram.com/riven.app"
                className="bg-teal-600 text-white rounded-lg px-6 py-3 font-medium text-sm"
              >
                Follow our journey
              </Button>
            </Section>
          </Container>

          {/* Footer — below the card */}
          <Section className="text-center pt-6 pb-8">
            <Img
              src={`${cdnBase}/images/email/logo-icon.png`}
              width={24}
              height={24}
              alt=""
              style={{ margin: '0 auto' }}
            />
            <Text className="text-xs text-gray-400 mt-2 mb-0">
              Riven · riven.software
            </Text>
          </Section>

        </Body>
      </Tailwind>
    </Html>
  );
}

// PreviewProps feeds sample data to the react-email preview server
WaitlistConfirmation.PreviewProps = {
  name: 'Alex',
} satisfies WaitlistConfirmationProps;

export default WaitlistConfirmation;
