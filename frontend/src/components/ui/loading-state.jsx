import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

function LoadingState({ message, className, size = "md" }) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner size={size} />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

export { LoadingState };
