import Image from "next/image";
import { Logo } from "./ui/logo";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="
      border-t
      bg-background
      px-4 py-8
      md:px-8 md:py-12
      lg:px-12
    "
    >
      <div
        className="
        mx-auto
        max-w-7xl
        flex flex-col
        gap-6
        md:flex-row
        md:items-center
        md:justify-between
      "
      >
        {/* FOOT-03: Logo/wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <Logo
            size={80}
            secondaryClassName="fill-background"
            primaryClassName="text-primary dark:text-[#D3C79B]"
          />
          <span className="font-mono font-bold mt-3 text-3xl tracking-tight">
            Riven
          </span>
        </Link>

        {/* FOOT-02: Contact email link */}
        <nav className="flex gap-6">
          <a
            href="mailto:hello@riven.dev"
            className="
              text-sm text-muted-foreground
              hover:text-foreground
              transition-colors
              min-h-[48px]
              flex items-center
            "
          >
            Contact
          </a>
        </nav>

        {/* FOOT-01: Copyright notice */}
        <p className="text-sm text-muted-foreground">
          © {currentYear} Riven. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
