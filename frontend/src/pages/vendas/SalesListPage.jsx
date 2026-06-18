import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { CreateFab } from "@/components/cadastros/CreateFab";
import { EntityListIconAction } from "@/components/cadastros/EntityListItem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  formatCurrencyFromCents,
  PAYMENT_METHOD_OPTIONS,
} from "@/config/vendas-modules";
import { useSession } from "@/contexts/session-context";
import { useToast } from "@/contexts/toast-context";
import { normalizeRole } from "@/features/agenda/utils";
import { CancelSaleDialog } from "@/features/vendas/components/CancelSaleDialog";
import { CancelledSaleDialog } from "@/features/vendas/components/CancelledSaleDialog";
import { NewSaleDialog } from "@/features/vendas/components/NewSaleDialog";
import { SaleStatusBadge } from "@/features/vendas/components/SaleStatusBadge";
import { getApiErrorMessage } from "@/lib/api-error";
import { cancelSale, listSales } from "@/services/sales-api";

const CANCELLABLE_STATUSES = new Set(["REGISTRADA", "QUITADA", "FIADO_PENDENTE"]);

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function paymentLabel(value) {
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function SalesListPage() {
  const { user } = useSession();
  const toast = useToast();
  const isAdmin = normalizeRole(user?.role) === "ADMINISTRADOR";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState(todayIsoDate());
  const [dateTo, setDateTo] = useState(todayIsoDate());
  const [sales, setSales] = useState([]);
  const [newSaleDialogOpen, setNewSaleDialogOpen] = useState(false);
  const [cancelSaleId, setCancelSaleId] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelledSaleView, setCancelledSaleView] = useState(null);
  const [cancelledSaleDialogOpen, setCancelledSaleDialogOpen] = useState(false);

  async function loadSales() {
    setLoading(true);
    setError("");
    try {
      const response = await listSales({ dateFrom, dateTo, limit: 100 });
      setSales(response.items ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar as vendas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, [dateFrom, dateTo]);

  const summary = useMemo(() => {
    const totals = {};
    let totalCents = 0;
    for (const sale of sales) {
      if (sale.status === "CANCELADA") {
        continue;
      }
      totalCents += sale.totalCents ?? 0;
      const key = sale.paymentMethod ?? "OUTRO";
      totals[key] = (totals[key] ?? 0) + (sale.totalCents ?? 0);
    }
    return { totalCents, totals, count: sales.filter((s) => s.status !== "CANCELADA").length };
  }, [sales]);

  function openNewSaleDialog() {
    setNewSaleDialogOpen(true);
  }

  function closeCancelDialog() {
    setCancelDialogOpen(false);
    setCancelSaleId("");
    setCancelReason("");
    setCancelReasonError("");
  }

  function openCancelDialog(saleId) {
    setCancelSaleId(saleId);
    setCancelReason("");
    setCancelReasonError("");
    setCancelDialogOpen(true);
  }

  function openCancelledSaleDialog(sale) {
    setCancelledSaleView(sale);
    setCancelledSaleDialogOpen(true);
  }

  async function handleCancelSubmit(event) {
    event.preventDefault();
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setCancelReasonError("Informe a justificativa do cancelamento.");
      return;
    }

    setCancelling(true);
    try {
      await cancelSale(cancelSaleId, trimmedReason);
      toast.success("Venda cancelada.");
      closeCancelDialog();
      loadSales();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível cancelar a venda."));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="relative space-y-4 pb-24 sm:pb-0">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-ama-text">Vendas</CardTitle>
            <CardDescription>Consulte vendas por período e registre novas vendas.</CardDescription>
          </div>
          <Button type="button" onClick={openNewSaleDialog} className="hidden sm:inline-flex">
            <Plus className="mr-2 size-4" />
            Nova venda
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">De</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Até</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-ama-cyan/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total do período</p>
            <p className="mt-1 text-2xl font-bold text-ama-blue-dark">
              {formatCurrencyFromCents(summary.totalCents)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-ama-cyan/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Quantidade</p>
            <p className="mt-1 text-2xl font-bold text-ama-blue-dark">{summary.count}</p>
          </CardContent>
        </Card>
        <Card className="border-ama-cyan/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Formas de pagamento</p>
            <div className="mt-2 space-y-1 text-sm">
              {Object.entries(summary.totals).length === 0 ? (
                <p className="text-muted-foreground">—</p>
              ) : (
                Object.entries(summary.totals).map(([method, cents]) => (
                  <div key={method} className="flex justify-between gap-2">
                    <span>{paymentLabel(method)}</span>
                    <span className="font-medium">{formatCurrencyFromCents(cents)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {loading ? <ListSkeleton rows={5} /> : null}

      {!loading ? (
        <Card className="border-ama-cyan/30">
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-ama-light text-center">
                <tr>
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma venda no período.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id} className="border-t border-ama-cyan/10">
                      <td className="px-4 py-3 text-center">{sale.saleNumber}</td>
                      <td className="px-4 py-3 text-center">
                        {new Date(sale.soldAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-center">{paymentLabel(sale.paymentMethod)}</td>
                      <td className="px-4 py-3 text-center">
                        <SaleStatusBadge status={sale.status} />
                      </td>
                      <td className="px-4 py-3 text-center">{sale.buyerName ?? "-"}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        {formatCurrencyFromCents(sale.totalCents)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAdmin && CANCELLABLE_STATUSES.has(sale.status) ? (
                          <EntityListIconAction
                            label="Cancelar venda"
                            icon={Trash2}
                            tone="destructive"
                            iconClassName="text-red-600"
                            onClick={() => openCancelDialog(sale._id)}
                          />
                        ) : sale.status === "CANCELADA" ? (
                          <EntityListIconAction
                            label="Ver venda cancelada"
                            icon={Eye}
                            onClick={() => openCancelledSaleDialog(sale)}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {!newSaleDialogOpen ? (
        <CreateFab onClick={openNewSaleDialog} label="Nova venda" />
      ) : null}

      <NewSaleDialog
        open={newSaleDialogOpen}
        onOpenChange={setNewSaleDialogOpen}
        onSuccess={() => loadSales()}
      />

      <CancelledSaleDialog
        open={cancelledSaleDialogOpen}
        sale={cancelledSaleView}
        onOpenChange={(open) => {
          setCancelledSaleDialogOpen(open);
          if (!open) {
            setCancelledSaleView(null);
          }
        }}
      />

      <CancelSaleDialog
        open={cancelDialogOpen}
        saving={cancelling}
        cancelReason={cancelReason}
        cancelReasonError={cancelReasonError}
        onCancelReasonChange={(value) => {
          setCancelReason(value);
          if (cancelReasonError) {
            setCancelReasonError("");
          }
        }}
        onSubmit={handleCancelSubmit}
        onClose={closeCancelDialog}
      />
    </div>
  );
}
