import { Badge } from "@/components/ui/badge";
import { getSaleStatusLabel } from "@/config/vendas-modules";
import { cn } from "@/lib/utils";

const SALE_STATUS_STYLES = {
  REGISTRADA: "border-transparent bg-emerald-600 text-white hover:bg-emerald-600",
  FIADO_PENDENTE: "border-transparent bg-amber-500 text-white hover:bg-amber-500",
  QUITADA: "border-transparent bg-emerald-600 text-white hover:bg-emerald-600",
  CANCELADA: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export function SaleStatusBadge({ status }) {
  const label = getSaleStatusLabel(status);
  const style = SALE_STATUS_STYLES[status] ?? "border-muted-foreground/30 text-muted-foreground";

  return (
    <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", style)}>
      {label}
    </Badge>
  );
}
