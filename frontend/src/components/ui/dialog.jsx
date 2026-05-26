import { useEffect } from "react";
import { cn } from "@/lib/utils";

function Dialog({ open, onOpenChange, title, description, children, className }) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
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
          {title || description ? (
            <div className="mb-4 space-y-1">
              {title ? (
                <h2 id="dialog-title" className="text-lg font-semibold text-ama-blue-dark">
                  {title}
                </h2>
              ) : null}
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
