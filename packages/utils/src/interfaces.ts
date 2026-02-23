export interface ChildNodeProps {
  children: React.ReactNode;
}

export interface ClassNameProps {
  className?: string;
}

export interface LinkProps {
  href: string;
  label: string;
  shouldCloseOnClick?: boolean;
  external?: boolean;
}
