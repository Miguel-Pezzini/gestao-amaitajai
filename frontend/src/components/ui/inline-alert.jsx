import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-amber-500/30 bg-amber-50 text-amber-800",
  info: "border-ama-cyan/40 bg-ama-light text-ama-blue-dark",
};

function InlineAlert({ children, variant = "error", className, ...props }) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-md border px-3 py-2 text-sm break-words",
        VARIANT_STYLES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export { InlineAlert };
