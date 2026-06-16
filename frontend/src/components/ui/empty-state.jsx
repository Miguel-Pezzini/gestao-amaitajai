import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-ama-light">
          <Icon className="size-6 text-ama-blue" aria-hidden="true" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-medium text-ama-blue-dark">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
          {secondaryActionLabel && onSecondaryAction ? (
            <Button type="button" variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { EmptyState };
