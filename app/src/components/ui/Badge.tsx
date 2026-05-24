import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "review" | "locked";

type Props = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export default function Badge({ children, variant = "neutral", className = "" }: Props) {
  return <span className={`ui-badge ui-badge--${variant} ${className}`.trim()}>{children}</span>;
}
