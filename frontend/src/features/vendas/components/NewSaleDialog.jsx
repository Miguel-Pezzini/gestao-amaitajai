import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrencyFromCents,
  PAYMENT_METHOD_OPTIONS,
} from "@/config/vendas-modules";
import { useNewSale } from "@/hooks/useNewSale";

export function NewSaleDialog({ open, onOpenChange, onSuccess }) {
  const sale = useNewSale({
    enabled: open,
    onSuccess: (createdSale) => {
      onSuccess?.(createdSale);
      onOpenChange(false);
    },
  });

  function handleClose() {
    sale.resetSale();
    onOpenChange(false);
  }

  async function handleFinalize() {
    await sale.handleFinalize();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(true);
      }}
      title="Nova venda"
      description="Selecione os produtos e finalize o pagamento."
      className="sm:max-w-6xl"
    >
      {sale.error ? <InlineAlert className="mb-4">{sale.error}</InlineAlert> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-3 rounded-lg border border-ama-cyan/20 p-3">
          <h3 className="text-sm font-semibold text-ama-text">Produtos</h3>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={sale.search}
              onChange={(event) => sale.setSearch(event.target.value)}
              placeholder="Buscar produto..."
              className="pl-9"
            />
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {sale.loading ? <ListSkeleton rows={4} /> : null}
            {!sale.loading && sale.filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto disponível.</p>
            ) : null}
            {sale.filteredProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between gap-2 rounded-md border border-ama-cyan/20 p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ama-text">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrencyFromCents(product.salePriceCents)} · Est. {product.stockQty}
                  </p>
                </div>
                <Button type="button" size="icon" onClick={() => sale.addProduct(product)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-ama-cyan/20 p-3">
          <h3 className="text-sm font-semibold text-ama-text">Itens da venda</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {sale.cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carrinho vazio.</p>
            ) : (
              sale.cart.map((line) => (
                <div
                  key={line.productId}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-ama-cyan/10 pb-2"
                >
                  <div>
                    <p className="text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrencyFromCents(line.unitPriceCents)} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => sale.updateQuantity(line.productId, line.quantity - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => sale.updateQuantity(line.productId, line.quantity + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatCurrencyFromCents(line.lineTotalCents)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => sale.removeLine(line.productId)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border border-ama-cyan/25 bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-ama-blue-dark">
              {formatCurrencyFromCents(sale.totalCents)}
            </span>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-ama-cyan/20 p-3">
          <h3 className="text-sm font-semibold text-ama-text">Pagamento</h3>
          <div className="space-y-2">
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-ama-cyan/20 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={sale.paymentMethod === option.value}
                  onChange={() => sale.setPaymentMethod(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {sale.paymentMethod === "FIADO" ? (
            <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="space-y-1">
                <Label htmlFor="buyerName">Nome</Label>
                <Input
                  id="buyerName"
                  value={sale.buyerName}
                  onChange={(event) => sale.setBuyerName(event.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="promisedPayAt">Data que irá pagar</Label>
                <Input
                  id="promisedPayAt"
                  type="date"
                  value={sale.promisedPayAt}
                  onChange={(event) => sale.setPromisedPayAt(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={sale.notes}
              onChange={(event) => sale.setNotes(event.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={sale.saving || sale.cart.length === 0}
              onClick={handleFinalize}
            >
              {sale.saving ? "Finalizando..." : "Finalizar venda"}
            </Button>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
