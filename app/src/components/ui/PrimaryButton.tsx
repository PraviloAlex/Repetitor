import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "soft" | "ghost";
};

export default function PrimaryButton({ children, variant = "primary", className = "", ...props }: Props) {
  return (
    <button className={`primary-button primary-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
