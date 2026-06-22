import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { EntityListIconAction } from "@/components/cadastros/EntityListItem";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyFromCents } from "@/config/vendas-modules";
import { cn } from "@/lib/utils";
import {
  getProductStockLevel,
  STOCK_LEGEND_ITEMS,
  STOCK_LEVEL_STYLES,
} from "@/features/vendas/utils/product-stock";

function ProductStatusBadge({ active }) {
  if (active) {
    return (
      <Badge className="rounded-full border-transparent bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-emerald-600">
        Ativo
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full border-muted-foreground/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
    >
      Inativo
    </Badge>
  );
}

export function ProductsTable({ products, onEdit, onToggleStatus }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ama-cyan/20">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ama-cyan/20 bg-ama-light/40 text-center text-xs font-semibold tracking-wide text-ama-blue-dark uppercase">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço venda</th>
              <th className="px-4 py-3">Custo</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockLevel = getProductStockLevel(product.stockQty, product.minStockQty);

              return (
                <tr
                  key={product._id}
                  className="border-b border-ama-cyan/10 last:border-b-0 hover:bg-ama-light/20"
                >
                  <td className="px-4 py-3 text-center font-medium text-ama-text">{product.name}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {product.category?.name ?? "Sem categoria"}
                  </td>
                  <td className="px-4 py-3 text-center text-ama-text">
                    {formatCurrencyFromCents(product.salePriceCents)}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {product.costCents != null
                      ? formatCurrencyFromCents(product.costCents)
                      : "—"}
                  </td>
                  <td className={cn("px-4 py-3 text-center", STOCK_LEVEL_STYLES[stockLevel])}>
                    {product.stockQty ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProductStatusBadge active={product.isActive} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <EntityListIconAction
                        label="Editar"
                        icon={Pencil}
                        onClick={() => onEdit(product)}
                      />
                      <EntityListIconAction
                        label={product.isActive ? "Inativar" : "Reativar"}
                        icon={product.isActive ? Trash2 : RotateCcw}
                        tone={product.isActive ? "destructive" : "default"}
                        onClick={() => onToggleStatus(product)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-ama-cyan/20 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        {STOCK_LEGEND_ITEMS.map((item) => (
          <span key={item.level} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", item.dotClass)} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
