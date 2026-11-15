"use client";

import Link from "next/link";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "teal" | "outline" | "outlineLight" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-fg text-ink-900 hover:bg-cocoa dark:hover:bg-umber",
  teal: "bg-espresso text-cream hover:bg-cocoa dark:hover:bg-umber",
  outline: "border border-fg/20 text-fg hover:border-mint-400 hover:text-mint-300",
  outlineLight: "border border-fg/20 text-fg hover:bg-fg hover:text-ink-900",
  ghost: "text-fg/80 hover:bg-fg/[0.06] hover:text-fg",
  subtle: "bg-fg/[0.06] text-fg hover:bg-fg/[0.12]",
  danger: "border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-4 text-[13px]",
  md: "h-11 gap-2 px-6 text-sm",
  lg: "h-[52px] gap-2.5 px-8 text-[15px]",
};

type Props = {
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
  href?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function buttonClasses(variant: ButtonVariant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium transition duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({ variant = "primary", size = "md", loading, href, icon, iconRight, className, children, disabled, ...rest }: Props) {
  const cls = buttonClasses(variant, size, className);
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
