import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "flame";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  /** Icon after the label instead of before it. */
  iconEnd?: LucideIcon;
  loading?: boolean;
  children?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-ink text-on-ink hover:bg-ink/90 disabled:bg-ink/40 disabled:text-on-ink/80",
  secondary:
    "border border-line bg-transparent text-ink hover:bg-wash disabled:text-ink-3 disabled:hover:bg-transparent",
  ghost: "text-ink-2 hover:bg-wash hover:text-ink disabled:text-ink-4",
  danger:
    "border border-loss/30 bg-loss-wash text-loss hover:bg-loss/15 disabled:opacity-50",
  flame:
    "bg-flame text-white hover:brightness-105 disabled:opacity-50 shadow-[0_8px_24px_-10px_var(--flame)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-md px-2.5 text-[13px]",
  md: "h-10 gap-2 rounded-lg px-3.5 text-sm",
  lg: "h-12 gap-2 rounded-lg px-5 text-[15px]",
};

const ICON: Record<Size, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-[18px] w-[18px]",
};

/**
 * The one button. Ink for the primary action, an outline for the rest.
 *
 * Deliberately not HeroUI's: a native button carries focus, keyboard and
 * press feedback on its own, and keeps the visual language in one place.
 */
export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconEnd: IconEnd,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const Lead = loading ? Loader2 : Icon;

  return (
    <button
      className={clsx(
        "press inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium",
        "transition-[background-color,color,border-color,filter] duration-[var(--dur-hover)] ease-out",
        "disabled:cursor-not-allowed disabled:active:transform-none",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...rest}
    >
      {Lead && (
        <Lead
          aria-hidden
          className={clsx(ICON[size], loading && "animate-spin")}
          strokeWidth={2}
        />
      )}
      {children}
      {IconEnd && !loading && (
        <IconEnd aria-hidden className={ICON[size]} strokeWidth={2} />
      )}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: "sm" | "md";
  tone?: "default" | "danger";
}

/** A square icon-only button with an accessible name. */
export function IconButton({
  icon: Icon,
  label,
  size = "md",
  tone = "default",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={clsx(
        "press grid shrink-0 place-items-center rounded-md transition-colors duration-[var(--dur-hover)]",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        tone === "danger"
          ? "text-ink-3 hover:bg-loss-wash hover:text-loss"
          : "text-ink-3 hover:bg-wash hover:text-ink",
        className,
      )}
      title={label}
      type={type}
      {...rest}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}
