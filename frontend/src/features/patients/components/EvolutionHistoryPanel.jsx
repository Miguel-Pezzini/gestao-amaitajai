import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSessionDateTime } from "@/features/agenda/utils";

function formatEvolutionPreview(content) {
  const normalized = String(content ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || "Sem conteúdo registrado";
}

export function EvolutionHistoryPanel({ entry }) {
  const sessionLabel = [
    formatSessionDateTime(entry.session?.startAt),
    entry.session?.sessionType?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const preview = formatEvolutionPreview(entry.content);
  const updatedBy = entry.updatedBy?.name;

  return (
    <details className="group min-w-0 overflow-hidden rounded-md border border-ama-cyan/15 bg-white">
      <summary
        className={cn(
          "cursor-pointer list-none px-3 py-2.5 transition-colors hover:bg-ama-light/40",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
            <p className="break-words text-xs font-medium text-muted-foreground">{sessionLabel}</p>
            <p className="line-clamp-2 break-words text-sm text-ama-blue-dark/80 group-open:hidden">
              {preview}
            </p>
          </div>
          <ChevronDown
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      </summary>
      <div className="min-w-0 space-y-2 overflow-hidden border-t border-ama-cyan/10 px-3 py-2.5">
        <p className="whitespace-pre-wrap break-words text-sm text-ama-blue-dark [overflow-wrap:anywhere]">
          {entry.content?.trim() || "—"}
        </p>
        {updatedBy ? (
          <p className="text-xs text-muted-foreground">Registrado por {updatedBy}</p>
        ) : null}
      </div>
    </details>
  );
}

export function EvolutionHistoryList({
  items,
  emptyMessage = "Nenhuma evolução registrada para este usuário.",
  listClassName = "max-h-56",
}) {
  if (!items?.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div
      className={cn(
        "min-w-0 space-y-2 overflow-x-hidden overflow-y-auto pr-1",
        listClassName,
      )}
    >
      {items.map((entry) => (
        <EvolutionHistoryPanel key={entry._id} entry={entry} />
      ))}
    </div>
  );
}
