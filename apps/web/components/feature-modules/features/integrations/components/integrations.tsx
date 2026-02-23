"use client";

import { LogoItem, LogoLoop } from "@/components/LogoLoop";
import { SectionDivider } from "@/components/ui/section-divider";
import { SiClaude, SiOpenai, SiTypeform } from "react-icons/si";

// Alternative with image sources
const logos: LogoItem[] = [
  {
    src: "/images/logos/gmail.avif",
    alt: "Gmail",
    href: "/images/logos/gmail.avif",
  },
  {
    src: "/images/logos/jotform-logo-dark.svg",
    alt: "Jotform",
    href: "/images/logos/gmail.avif",
  },
  {
    src: "/images/logos/whatsapp.avif",
    alt: "Whatsapp",
    href: "/images/logos/gmail.avif",
  },
  {
    src: "/images/logos/slack.webp",
    alt: "Slack",
    href: "/images/logos/gmail.avif",
  },
  {
    node: <SiOpenai size={42} />,
    alt: "Typeform",
    href: "/images/logos/gmail.avif",
  },
  {
    src: "/images/logos/linkedin.webp",
    alt: "Linkedin",
    href: "/images/logos/gmail.avif",
  },
  {
    node: <SiTypeform size={92} />,
    alt: "Typeform",
    href: "/images/logos/gmail.avif",
  },
  {
    node: <SiClaude size={42} />,
    alt: "Typeform",
    href: "/images/logos/gmail.avif",
  },
];

export const Integrations = () => {
  return (
    <>
      <SectionDivider name="Third Party Integrations" />
      <div
        style={{ height: "200px", position: "relative", overflow: "hidden" }}
      >
        {/* Basic horizontal loop */}
        <LogoLoop
          logos={logos}
          speed={50}
          direction="left"
          logoHeight={40}
          gap={60}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor="var(--foreground)"
          ariaLabel="Technology partners"
        />
      </div>
    </>
  );
};
