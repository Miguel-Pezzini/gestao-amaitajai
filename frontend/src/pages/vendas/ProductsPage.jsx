import { useEffect, useMemo, useState } from "react";
import { FolderPlus, Plus, Search } from "lucide-react";
import { CreateFab } from "@/components/cadastros/CreateFab";
import { ProductsTable } from "@/features/vendas/components/ProductsTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCentsInput,
  parseCurrencyToCents,
} from "@/config/vendas-modules";
import { useToast } from "@/contexts/toast-context";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createProduct,
  createProductCategory,
  listProductCategories,
  listProducts,
  updateProduct,
  updateProductStatus,
} from "@/services/sales-api";

const EMPTY_FORM = {
  name: "",
  categoryId: "",
  salePrice: "",
  costPrice: "",
  stockQty: "0",
  minStockQty: "0",
};

const EMPTY_CATEGORY = { name: "" };

function sortProductsByStatusAndName(items) {
  return [...items].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return String(a.name ?? "").localeCompare(String(b.name ?? ""), "pt-BR", {
      sensitivity: "base",
    });
  });
}

export function ProductsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        listProducts({ activeOnly: false }),
        listProductCategories({ includeInactive: true }),
      ]);
      setProducts(productsResponse.items ?? []);
      setCategories(categoriesResponse.items ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar os produtos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = products.filter((item) => {
      if (!term) return true;
      const categoryName = String(item.category?.name ?? "").toLowerCase();
      return (
        String(item.name ?? "").toLowerCase().includes(term) || categoryName.includes(term)
      );
    });
    return sortProductsByStatusAndName(filtered);
  }, [products, search]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId("");
    setFormDialogOpen(false);
  }

  function openCreate() {
    resetForm();
    setFormDialogOpen(true);
  }

  function openEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name ?? "",
      categoryId: product.category?._id ?? "",
      salePrice: formatCentsInput(product.salePriceCents),
      costPrice: product.costCents != null ? formatCentsInput(product.costCents) : "",
      stockQty: String(product.stockQty ?? 0),
      minStockQty: String(product.minStockQty ?? 0),
    });
    setFormDialogOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const salePriceCents = parseCurrencyToCents(form.salePrice);
    if (salePriceCents == null) {
      toast.error("Preço de venda inválido.");
      return;
    }
    if (!form.categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      salePriceCents,
      costCents: form.costPrice ? parseCurrencyToCents(form.costPrice) : null,
      stockQty: Number.parseInt(form.stockQty, 10) || 0,
      minStockQty: Number.parseInt(form.minStockQty, 10) || 0,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await updateProduct(editingId, payload);
        toast.success("Produto atualizado.");
      } else {
        await createProduct(payload);
        toast.success("Produto criado.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível salvar o produto."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(product) {
    try {
      await updateProductStatus(product._id, !product.isActive);
      toast.success(product.isActive ? "Produto inativado." : "Produto reativado.");
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível alterar o status."));
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Nome da categoria é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await createProductCategory({ name: categoryForm.name.trim() });
      toast.success("Categoria criada.");
      setCategoryForm(EMPTY_CATEGORY);
      setCategoryDialogOpen(false);
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível criar a categoria."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-4 border-b border-ama-cyan/15 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-ama-text">Produtos</CardTitle>
            <CardDescription>Cadastre itens da cantina e controle estoque.</CardDescription>
          </div>
          <Button type="button" variant="secondary" onClick={() => setCategoryDialogOpen(true)}>
            <FolderPlus className="size-4" />
            Nova categoria
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              Novo produto
            </Button>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produto..."
                className="pl-9"
              />
            </div>
          </div>

          {error ? <InlineAlert>{error}</InlineAlert> : null}

          {loading ? <ListSkeleton rows={5} /> : null}

          {!loading && filteredProducts.length === 0 ? (
            <EmptyState title="Nenhum produto encontrado" description="Cadastre o primeiro produto." />
          ) : null}

          {!loading && filteredProducts.length > 0 ? (
            <ProductsTable
              products={filteredProducts}
              onEdit={openEdit}
              onToggleStatus={handleToggleStatus}
            />
          ) : null}
        </CardContent>
      </Card>

      <CreateFab onClick={openCreate} label="Novo produto" />

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen} title={isEditing ? "Editar produto" : "Novo produto"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="salePrice">Preço de venda (R$)</Label>
              <Input
                id="salePrice"
                value={form.salePrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, salePrice: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="costPrice">Custo (R$)</Label>
              <Input
                id="costPrice"
                value={form.costPrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, costPrice: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="stockQty">Estoque</Label>
              <Input
                id="stockQty"
                type="number"
                min="0"
                value={form.stockQty}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stockQty: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="minStockQty">Estoque mínimo</Label>
              <Input
                id="minStockQty"
                type="number"
                min="0"
                value={form.minStockQty}
                onChange={(event) =>
                  setForm((current) => ({ ...current, minStockQty: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title="Nova categoria"
      >
        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <div className="space-y-1">
            <Label htmlFor="categoryName">Nome</Label>
            <Input
              id="categoryName"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ name: event.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Criar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
