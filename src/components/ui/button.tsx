import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // The accent gradient plus a tinted shadow is what makes the primary CTA
  // read as the one lit object on an otherwise quiet screen.
  primary:
    "accent-gradient text-primary-foreground shadow-[0_10px_24px_-10px_rgba(79,70,229,0.5)] hover:brightness-[1.07] hover:shadow-[0_14px_30px_-10px_rgba(79,70,229,0.55)] active:brightness-100",
  // Frosted rather than plain white, so secondary actions still sit in the
  // same material language as the glass panels behind them.
  secondary:
    "bg-surface/85 backdrop-blur-sm text-foreground border border-border-strong shadow-sm hover:bg-surface",
  outline:
    "bg-primary-subtle/75 backdrop-blur-sm text-primary border border-primary-border hover:bg-primary-subtle",
  ghost: "text-muted-foreground hover:bg-surface-muted/80 hover:text-foreground",
  danger:
    "bg-danger-subtle/80 backdrop-blur-sm text-danger-strong border border-danger-border hover:bg-danger-subtle",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

const BASE =
  // `touch-manipulation` removes the legacy 300ms double-tap-zoom delay on
  // touch devices, so a tap registers as a click immediately.
  "inline-flex touch-manipulation items-center justify-center gap-2 rounded-md font-medium tracking-[-0.01em] transition-[background-color,color,border-color,box-shadow,filter,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45";

export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  return cn(
    BASE,
    VARIANTS[options?.variant ?? "primary"],
    SIZES[options?.size ?? "md"],
    options?.className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction without changing layout. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
