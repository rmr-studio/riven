export interface ClassNameProps {
  className?: string;
}

export interface LinkProps {
  href: string;
  label: string;
  shouldCloseOnClick?: boolean;
  external?: boolean;
}

export interface NavbarProps extends ClassNameProps {
  links: readonly LinkProps[];
}
