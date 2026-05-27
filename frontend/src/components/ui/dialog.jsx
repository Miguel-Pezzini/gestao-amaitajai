import { useEffect } from "react";
import { cn } from "@/lib/utils";

function Dialog({
  open,
  onOpenChange,
  title,
  description,
  headerAction,
  children,
  className,
  nested = false,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4",
        nested ? "z-[60]" : "z-50",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-ama-cyan/30 bg-background shadow-xl sm:max-w-lg sm:rounded-xl",
          className,
        )}
      >
        <div className="overflow-y-auto p-4 sm:p-6">
          {title || description || headerAction ? (
            <div className="mb-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                {title ? (
                  <h2
                    id="dialog-title"
                    className="min-w-0 flex-1 text-lg font-semibold capitalize leading-snug text-ama-blue-dark"
                  >
                    {title}
                  </h2>
                ) : null}
                {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
              </div>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export { Dialog };
