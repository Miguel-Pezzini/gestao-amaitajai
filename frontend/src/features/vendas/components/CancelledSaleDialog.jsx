import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  formatCurrencyFromCents,
  PAYMENT_METHOD_OPTIONS,
} from "@/config/vendas-modules";
import { SaleStatusBadge } from "@/features/vendas/components/SaleStatusBadge";

function paymentLabel(value) {
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString("pt-BR");
}

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-ama-cyan/10 py-2.5 last:border-0 sm:grid-cols-[7rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-ama-blue-dark">{children}</dd>
    </div>
  );
}

export function CancelledSaleDialog({ open, sale, onOpenChange }) {
  if (!sale) {
    return null;
  }

  const cancelReason = String(sale.cancelReason ?? "").trim();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Venda ${sale.saleNumber}`}
      description="Venda cancelada — consulte a justificativa e os itens."
      className="sm:max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SaleStatusBadge status={sale.status} />
        </div>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Justificativa do cancelamento
          </h3>
          <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {cancelReason || "—"}
          </p>
          {sale.cancelledAt ? (
            <p className="text-xs text-muted-foreground">
              Cancelada em {formatDateTime(sale.cancelledAt)}
            </p>
          ) : null}
        </section>

        <dl className="rounded-lg border border-ama-cyan/20 bg-white px-4">
          <DetailRow label="Data">{formatDateTime(sale.soldAt)}</DetailRow>
          <DetailRow label="Pagamento">{paymentLabel(sale.paymentMethod)}</DetailRow>
          <DetailRow label="Operador">{sale.createdBy?.name ?? "—"}</DetailRow>
          <DetailRow label="Cliente">{sale.buyerName ?? "—"}</DetailRow>
          <DetailRow label="Total">{formatCurrencyFromCents(sale.totalCents)}</DetailRow>
        </dl>

        {(sale.items ?? []).length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-ama-cyan/20">
            <table className="min-w-full text-sm">
              <thead className="bg-ama-light/40 text-center text-xs font-semibold uppercase text-ama-blue-dark">
                <tr>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2">Qtd</th>
                  <th className="px-3 py-2">Unitário</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item._id} className="border-t border-ama-cyan/10 text-center">
                    <td className="px-3 py-2">{item.product?.name ?? "—"}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">
                      {formatCurrencyFromCents(item.unitPriceCents)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {formatCurrencyFromCents(item.lineTotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
