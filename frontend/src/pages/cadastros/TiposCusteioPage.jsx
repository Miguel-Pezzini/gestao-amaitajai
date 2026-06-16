import { useEffect, useMemo, useState } from "react";
import { Coins, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import {
  EntityList,
  EntityListItem,
  EntityListIconAction,
  EntityListItemFooterRow,
  EntityNameForm,
  EntityStatusBadge,
} from "@/components/cadastros/EntityListItem";
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
import { CreateFab } from "@/components/cadastros/CreateFab";
import { useToast } from "@/contexts/toast-context";
import { useSession } from "@/contexts/session-context";
import {
  createFundingSource,
  listFundingSources,
  updateFundingSource,
  updateFundingSourceStatus,
} from "@/services/funding-sources";
import { getApiErrorMessage } from "@/lib/api-error";

const EMPTY_FORM = { name: "" };

export function TiposCusteioPage() {
  const { userName } = useSession();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [fundingSources, setFundingSources] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadFundingSources() {
    setLoading(true);
    setError("");
    try {
      const response = await listFundingSources();
      setFundingSources(response.items ?? []);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar as fontes de custeio. Tente novamente."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFundingSources();
  }, []);

  const filteredSources = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fundingSources.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!term) return true;
      return String(item.name ?? "").toLowerCase().includes(term);
    });
  }, [fundingSources, search, statusFilter]);

  const activeCount = useMemo(
    () => filteredSources.filter((item) => item.isActive).length,
    [filteredSources],
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId("");
    setFieldErrors({});
  }

  function closeFormDialog() {
    setFormDialogOpen(false);
    resetForm();
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("active");
  }

  function openCreateDialog() {
    resetForm();
    setFormDialogOpen(true);
  }

  function openEditDialog(fundingSource) {
    setEditingId(fundingSource._id);
    setFieldErrors({});
    setForm({ name: fundingSource.name ?? "" });
    setFormDialogOpen(true);
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    const name = form.name.trim();
    if (!name) {
      setFieldErrors({ name: "Nome da fonte de custeio é obrigatório." });
      setSaving(false);
      return;
    }

    setFieldErrors({});

    try {
      if (isEditing) {
        await updateFundingSource(editingId, { name });
        toast.success("Fonte de custeio atualizada com sucesso.");
      } else {
        await createFundingSource({ name });
        toast.success("Fonte de custeio cadastrada com sucesso.");
      }
      closeFormDialog();
      await loadFundingSources();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Não foi possível salvar a fonte de custeio. Verifique os dados e tente novamente.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(fundingSource) {
    try {
      await updateFundingSourceStatus(fundingSource._id, !fundingSource.isActive);
      toast.success(
        fundingSource.isActive
          ? "Fonte de custeio inativada com sucesso."
          : "Fonte de custeio reativada com sucesso.",
      );
      await loadFundingSources();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Não foi possível atualizar o status da fonte de custeio."),
      );
    }
  }

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Fontes de custeio
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Cadastre as fontes de custeio usadas no cadastro dos atendidos.
          </CardDescription>
        </CardHeader>
      </Card>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
        title={isEditing ? "Editar fonte de custeio" : "Nova fonte de custeio"}
        description={
          isEditing
            ? "Altere o nome exibido no cadastro de pacientes."
            : "Informe o nome da nova fonte de custeio."
        }
      >
        <EntityNameForm
          id="funding-source-name"
          label="Nome da fonte"
          form={form}
          fieldErrors={fieldErrors}
          saving={saving}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onCancel={closeFormDialog}
          onFormChange={handleFormChange}
        />
      </Dialog>

      {!formDialogOpen ? (
        <CreateFab onClick={openCreateDialog} label="Nova fonte" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">Fontes cadastradas</CardTitle>
            <CardDescription className="break-words">
              {activeCount} ativa(s) em {filteredSources.length} exibida(s).
            </CardDescription>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="funding-source-search">Nome da fonte</Label>
              <Input
                id="funding-source-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="funding-source-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="funding-source-status-filter" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Apenas ativas</SelectItem>
                  <SelectItem value="inactive">Apenas inativas</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="justify-self-start bg-ama-cyan px-6 text-ama-blue-dark shadow-sm hover:bg-ama-cyan/90 sm:col-span-2 sm:justify-self-end"
              onClick={loadFundingSources}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <ListSkeleton />
          ) : fundingSources.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="Nenhuma fonte cadastrada"
              description="Cadastre fontes de custeio para vincular aos pacientes."
              actionLabel="Cadastrar fonte"
              onAction={openCreateDialog}
            />
          ) : filteredSources.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado"
              description="Nenhuma fonte encontrada para os filtros informados."
              actionLabel="Limpar filtros"
              onAction={clearFilters}
            />
          ) : (
            <EntityList>
              {filteredSources.map((fundingSource) => (
                <EntityListItem
                  key={fundingSource._id}
                  title={fundingSource.name}
                  badges={
                    <EntityStatusBadge
                      active={fundingSource.isActive}
                      activeLabel="Ativa"
                      inactiveLabel="Inativa"
                    />
                  }
                >
                  <EntityListItemFooterRow
                    actions={
                      <>
                        <EntityListIconAction
                          icon={Pencil}
                          label="Editar"
                          onClick={() => openEditDialog(fundingSource)}
                        />
                        <EntityListIconAction
                          icon={fundingSource.isActive ? Trash2 : RotateCcw}
                          label={fundingSource.isActive ? "Inativar" : "Reativar"}
                          tone={fundingSource.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(fundingSource)}
                        />
                      </>
                    }
                  />
                </EntityListItem>
              ))}
            </EntityList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
