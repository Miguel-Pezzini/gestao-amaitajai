import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  formatCurrencyFromCents,
  parseCurrencyToCents,
} from "@/config/vendas-modules";
import { useToast } from "@/contexts/toast-context";
import { getApiErrorMessage } from "@/lib/api-error";
import { SaleStatusBadge } from "@/features/vendas/components/SaleStatusBadge";
import { listFiados, receiveSalePayment } from "@/services/sales-api";

export function FiadosPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalPendingCents, setTotalPendingCents] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  async function loadFiados() {
    setLoading(true);
    setError("");
    try {
      const response = await listFiados();
      setItems(response.items ?? []);
      setTotalPendingCents(response.totalPendingCents ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar os fiados."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiados();
  }, []);

  function openPaymentDialog(sale) {
    setSelectedSale(sale);
    setPaymentAmount(((sale.pendingCents ?? 0) / 100).toFixed(2).replace(".", ","));
    setPaymentDialogOpen(true);
  }

  async function handleReceivePayment(event) {
    event.preventDefault();
    if (!selectedSale) {
      return;
    }
    const amountCents = parseCurrencyToCents(paymentAmount);
    if (amountCents == null || amountCents < 1) {
      toast.error("Valor inválido.");
      return;
    }

    setSaving(true);
    try {
      await receiveSalePayment(selectedSale._id, amountCents);
      toast.success("Pagamento registrado.");
      setPaymentDialogOpen(false);
      setSelectedSale(null);
      await loadFiados();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível registrar o pagamento."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-ama-cyan/30">
        <CardHeader>
          <CardTitle className="text-ama-text">Fiados</CardTitle>
          <CardDescription>Controle vendas a prazo e recebimentos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Total pendente</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrencyFromCents(totalPendingCents)}
          </p>
        </CardContent>
      </Card>

      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {loading ? <ListSkeleton rows={4} /> : null}

      {!loading ? (
        <Card className="border-ama-cyan/30">
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-ama-light text-center">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Pendente</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sale) => (
                  <tr key={sale._id} className="border-t border-ama-cyan/10">
                    <td className="px-4 py-3 text-center">{sale.buyerName ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      {sale.promisedPayAt
                        ? new Date(sale.promisedPayAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatCurrencyFromCents(sale.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatCurrencyFromCents(sale.amountPaidCents)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-red-600">
                      {formatCurrencyFromCents(sale.pendingCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SaleStatusBadge status={sale.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button type="button" size="sm" onClick={() => openPaymentDialog(sale)}>
                        Receber
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhum fiado pendente.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        title="Receber pagamento"
      >
        <form className="space-y-4" onSubmit={handleReceivePayment}>
          <p className="text-sm text-muted-foreground">
            Cliente: <strong>{selectedSale?.buyerName ?? "-"}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Pendente:{" "}
            <strong>{formatCurrencyFromCents(selectedSale?.pendingCents ?? 0)}</strong>
          </p>
          <div className="space-y-1">
            <Label htmlFor="paymentAmount">Valor recebido (R$)</Label>
            <Input
              id="paymentAmount"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
