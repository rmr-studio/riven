'use client';

import { Section } from '@/components/ui/section';
import { Github, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const GITHUB_URL = 'https://github.com/rmr-studio/riven';

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function OpenSource() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/rmr-studio/riven')
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Section id="open-source" navbarInverse>
      <div className="relative z-10 mx-auto flex flex-col items-center justify-center px-4 text-center sm:px-6">
        <h2 className="text-4xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Open source from day one
        </h2>

        <div className="mt-6 max-w-4xl text-lg text-muted-foreground sm:text-xl">
          <p>
            Riven is built in the open on GitHub. We believe that transparency fosters trust,
            invites collaboration, and accelerates innovation. By sharing our code, we hope to
            empower developers to contribute, learn, and build alongside us as we shape the future
            of data unification.
          </p>
          <p className="mt-8">
            We also want to make it easy for anyone to self-host their own Riven instance if they
            choose to do so — no black boxes, no hidden features, just an open invitation to explore
            and create with us.
          </p>
        </div>

        <Link
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 flex items-center gap-3 rounded-full border border-border/80 bg-muted/50 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Github className="size-5" />
          <span>@riven</span>
          {stars !== null && (
            <>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-current" />
                {formatStars(stars)}
              </span>
            </>
          )}
        </Link>
      </div>
    </Section>
  );
}
