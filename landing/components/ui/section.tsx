import { cn } from "@/lib/utils";
import React, { FC } from "react";
import { BGPattern, BGPatternProps } from "./background/grids";

interface Props extends BGPatternProps {
  id?: string;
  className?: string;
  gridClassName?: string;
  children?: React.ReactNode;
  navbarInverse?: boolean;
}

export const Section: FC<Props> = ({
  id,
  className,
  children,
  variant = "grid",
  mask = "fade-edges",
  gridClassName,
  size = 8,
  fill = "color-mix(in srgb, var(--primary) 15%, transparent)",
  navbarInverse,
  ...rest
}) => {
  return (
    <section
      id={id}
      className={cn("section", className)}
      {...(navbarInverse ? { "data-navbar-inverse": "" } : {})}
    >
      <BGPattern
        variant={variant}
        mask={mask}
        className={cn(gridClassName)}
        size={size}
        fill={fill}
        {...rest}
      />
      {children}
    </section>
  );
};
