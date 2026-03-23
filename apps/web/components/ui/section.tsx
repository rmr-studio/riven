import { cn } from '@/lib/utils';
import React from 'react';
import { BGPattern, BGPatternProps } from './background/grids';

interface Props extends React.SelectHTMLAttributes<HTMLDivElement> {
  id?: string;
  className?: string;
  variant?: BGPatternProps['variant'];
  mask?: BGPatternProps['mask'];
  size?: BGPatternProps['size'];
  fill?: BGPatternProps['fill'];
  gridClassName?: string;
  children?: React.ReactNode;
  navbarInverse?: boolean;
}

export const Section = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      id,
      className,
      children,
      variant = 'grid',
      mask = 'fade-edges',
      gridClassName,
      size = 8,
      fill = 'color-mix(in srgb, var(--primary) 7.5%, transparent)',
      navbarInverse,
      ...rest
    },
    ref,
  ) => {
    return (
      <section
        id={id}
        ref={ref}
        className={cn('relative z-20 overflow-hidden py-16 md:py-24 lg:px-12 lg:py-32', className)}
        {...(navbarInverse ? { 'data-navbar-inverse': '' } : {})}
        {...rest}
      >
        <BGPattern
          variant={variant}
          mask={mask}
          className={cn(gridClassName)}
          size={size}
          fill={fill}
        />
        {children}
      </section>
    );
  },
);

Section.displayName = 'Section';
