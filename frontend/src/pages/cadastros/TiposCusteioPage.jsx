import { useEffect, useMemo, useState } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  EntityList,
  EntityListItem,
  EntityListIconAction,
  EntityListItemFooterRow,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateFab } from "@/components/cadastros/CreateFab";
import { useSession } from "@/contexts/session-context";
import {
  createFundingSource,
  listFundingSources,
  updateFundingSource,
  updateFundingSourceStatus,
} from "@/services/funding-sources";

const EMPTY_FORM = { name: "" };

function FundingSourceForm({
  form,
  fieldErrors,
  saving,
  isEditing,
  onSubmit,
  onCancel,
  onFormChange,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="funding-source-name">Nome da fonte</Label>
        <Input
          id="funding-source-name"
          value={form.name}
          onChange={(event) => onFormChange("name", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.name ? (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
          disabled={saving}
        >
          {saving ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}

export function TiposCusteioPage() {
  const { userName } = useSession();
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
        err.response?.data?.message ??
          "Não foi possível carregar as fontes de custeio. Tente novamente.",
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
    setError("");

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
      } else {
        await createFundingSource({ name });
      }
      closeFormDialog();
      await loadFundingSources();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível salvar a fonte de custeio. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(fundingSource) {
    setError("");
    try {
      await updateFundingSourceStatus(fundingSource._id, !fundingSource.isActive);
      await loadFundingSources();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status da fonte de custeio.",
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

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm break-words text-destructive">
          {error}
        </p>
      ) : null}

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
        <FundingSourceForm
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
            <p className="text-sm text-muted-foreground">Carregando fontes...</p>
          ) : filteredSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma fonte encontrada para os filtros informados.
            </p>
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
