import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="
      border-t
      bg-background
      px-4 py-8
      md:px-8 md:py-12
      lg:px-12
    ">
      <div className="
        mx-auto
        max-w-7xl
        flex flex-col
        gap-6
        md:flex-row
        md:items-center
        md:justify-between
      ">
        {/* FOOT-03: Logo/wordmark */}
        <div className="flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="Riven"
            width={160}
            height={40}
            className="h-8 w-auto"
          />
        </div>

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
  )
}
