import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PendingProtocolBadge({ count = 1, className }) {
  const label =
    count > 1 ? `${count} protocolos pendentes` : "Protocolo pendente";

  return (
    <Badge
      variant="outline"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-amber-500/50 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800",
        className,
      )}
    >
      <ClipboardList className="size-3.5 shrink-0" aria-hidden="true" />
      {count > 1 ? <span>{count}</span> : null}
    </Badge>
  );
}
