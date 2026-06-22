import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { getApiErrorMessage } from "@/lib/api-error";
import { createSale, listProducts } from "@/services/sales-api";

function emptyCart() {
  return [];
}

export function useNewSale({ onSuccess, enabled = true } = {}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(emptyCart);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [notes, setNotes] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [promisedPayAt, setPromisedPayAt] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const response = await listProducts({ activeOnly: true, inStockOnly: true });
      setProducts(response.items ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar os produtos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }
    loadProducts();
  }, [enabled]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter((product) => {
      const name = String(product.name ?? "").toLowerCase();
      const category = String(product.category?.name ?? "").toLowerCase();
      return name.includes(term) || category.includes(term);
    });
  }, [products, search]);

  const totalCents = useMemo(
    () => cart.reduce((sum, line) => sum + line.lineTotalCents, 0),
    [cart],
  );

  function addProduct(product) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQty) {
          toast.error(`Estoque máximo: ${product.stockQty}`);
          return current;
        }
        return current.map((line) =>
          line.productId === product._id
            ? {
                ...line,
                quantity: line.quantity + 1,
                lineTotalCents: (line.quantity + 1) * line.unitPriceCents,
              }
            : line,
        );
      }
      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          maxStock: product.stockQty,
          quantity: 1,
          unitPriceCents: product.salePriceCents,
          lineTotalCents: product.salePriceCents,
        },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.productId !== productId) {
            return line;
          }
          const nextQty = Math.max(0, Math.min(line.maxStock, quantity));
          return {
            ...line,
            quantity: nextQty,
            lineTotalCents: nextQty * line.unitPriceCents,
          };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(productId) {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }

  function resetSale() {
    setCart(emptyCart());
    setPaymentMethod("PIX");
    setNotes("");
    setBuyerName("");
    setPromisedPayAt("");
    setSearch("");
    setError("");
  }

  async function handleFinalize() {
    if (cart.length === 0) {
      toast.error("Adicione ao menos um produto.");
      return;
    }

    if (paymentMethod === "FIADO") {
      if (!buyerName.trim()) {
        toast.error("Informe o nome do cliente.");
        return;
      }
      if (!promisedPayAt) {
        toast.error("Informe a data prevista de pagamento.");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const response = await createSale({
        paymentMethod,
        notes: notes.trim(),
        buyerName: buyerName.trim() || undefined,
        promisedPayAt: promisedPayAt || undefined,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });
      toast.success(`Venda #${response.sale.saleNumber} registrada.`);
      resetSale();
      await loadProducts();
      onSuccess?.(response.sale);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível finalizar a venda."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    saving,
    error,
    search,
    setSearch,
    filteredProducts,
    cart,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    buyerName,
    setBuyerName,
    promisedPayAt,
    setPromisedPayAt,
    totalCents,
    addProduct,
    updateQuantity,
    removeLine,
    resetSale,
    handleFinalize,
  };
}
