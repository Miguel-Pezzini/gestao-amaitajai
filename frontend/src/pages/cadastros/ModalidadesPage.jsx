import { useEffect, useMemo, useState } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  EntityList,
  EntityListItem,
  EntityListIconAction,
  EntityListItemFooterRow,
  EntityStatusBadge,
  EntityTagBadge,
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
  MODALITY_LABELS,
  MODALITY_OPTIONS,
  slugify,
} from "@/features/cadastros/constants";
import {
  createSessionType,
  listSessionTypes,
  updateSessionType,
  updateSessionTypeStatus,
} from "@/services/agenda";

const EMPTY_FORM = {
  name: "",
  defaultDurationMinutes: "60",
  isDurationFlexible: false,
  allowedModalities: ["INDIVIDUAL"],
};

function SessionTypeForm({
  form,
  fieldErrors,
  saving,
  isEditing,
  onSubmit,
  onCancel,
  onFormChange,
  onToggleModality,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="session-type-name">Nome</Label>
        <Input
          id="session-type-name"
          value={form.name}
          onChange={(event) => onFormChange("name", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.name ? (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-type-duration">Duração padrão (minutos)</Label>
        <Input
          id="session-type-duration"
          type="number"
          min={1}
          value={form.defaultDurationMinutes}
          onChange={(event) =>
            onFormChange("defaultDurationMinutes", event.target.value)
          }
          disabled={saving}
        />
        {fieldErrors.defaultDurationMinutes ? (
          <p className="text-sm text-destructive">
            {fieldErrors.defaultDurationMinutes}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isDurationFlexible}
          onChange={(event) =>
            onFormChange("isDurationFlexible", event.target.checked)
          }
          disabled={saving}
        />
        Duração flexível na agenda
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tipos de sessão permitidos</legend>
        <div className="flex flex-col gap-2">
          {MODALITY_OPTIONS.map((modality) => (
            <label key={modality} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allowedModalities.includes(modality)}
                onChange={() => onToggleModality(modality)}
                disabled={saving}
              />
              {MODALITY_LABELS[modality]}
            </label>
          ))}
        </div>
        {fieldErrors.allowedModalities ? (
          <p className="text-sm text-destructive">{fieldErrors.allowedModalities}</p>
        ) : null}
      </fieldset>

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

function validateSessionTypeForm(form, existingSlug) {
  const errors = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = "Nome é obrigatório.";
  }

  const duration = Number.parseInt(form.defaultDurationMinutes, 10);
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.defaultDurationMinutes = "Informe uma duração válida em minutos.";
  }

  if (!form.allowedModalities.length) {
    errors.allowedModalities = "Selecione ao menos um tipo de sessão.";
  }

  const slug = existingSlug ?? slugify(name);
  if (slug === "tea-14-plus" && form.allowedModalities.some((item) => item !== "GRUPO")) {
    errors.allowedModalities =
      "Esta modalidade permite apenas tipo de sessão em grupo.";
  }

  return errors;
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    defaultDurationMinutes: Number.parseInt(form.defaultDurationMinutes, 10),
    isDurationFlexible: Boolean(form.isDurationFlexible),
    allowedModalities: form.allowedModalities,
  };
}

export function ModalidadesPage() {
  const { userName } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sessionTypes, setSessionTypes] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadSessionTypes() {
    setLoading(true);
    setError("");
    try {
      const response = await listSessionTypes();
      setSessionTypes(response.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar as modalidades. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessionTypes();
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sessionTypes.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!term) return true;
      return String(item.name ?? "").toLowerCase().includes(term);
    });
  }, [sessionTypes, search, statusFilter]);

  const activeCount = useMemo(
    () => filteredItems.filter((item) => item.isActive).length,
    [filteredItems],
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId("");
    setEditingSlug("");
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

  function openEditDialog(item) {
    setEditingId(item._id);
    setEditingSlug(item.slug ?? "");
    setFieldErrors({});
    setForm({
      name: item.name ?? "",
      defaultDurationMinutes: String(item.defaultDurationMinutes ?? 60),
      isDurationFlexible: Boolean(item.isDurationFlexible),
      allowedModalities: item.allowedModalities ?? [],
    });
    setFormDialogOpen(true);
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function handleToggleModality(modality) {
    setForm((current) => {
      const exists = current.allowedModalities.includes(modality);
      const allowedModalities = exists
        ? current.allowedModalities.filter((item) => item !== modality)
        : [...current.allowedModalities, modality];
      return { ...current, allowedModalities };
    });
    setFieldErrors((current) => ({ ...current, allowedModalities: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const validationErrors = validateSessionTypeForm(form, isEditing ? editingSlug : null);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSaving(false);
      return;
    }

    setFieldErrors({});
    const payload = buildPayload(form);

    try {
      if (isEditing) {
        await updateSessionType(editingId, payload);
      } else {
        await createSessionType(payload);
      }
      closeFormDialog();
      await loadSessionTypes();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível salvar a modalidade. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item) {
    setError("");
    try {
      await updateSessionTypeStatus(item._id, !item.isActive);
      await loadSessionTypes();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status da modalidade.",
      );
    }
  }

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Modalidades
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Cadastre modalidades de atendimento e defina quais tipos de
            sessão (individual, dupla ou grupo) cada uma permite na agenda.
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
        title={isEditing ? "Editar modalidade" : "Nova modalidade"}
        description="Configure nome, duração e tipos de sessão permitidos."
      >
        <SessionTypeForm
          form={form}
          fieldErrors={fieldErrors}
          saving={saving}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onCancel={closeFormDialog}
          onFormChange={handleFormChange}
          onToggleModality={handleToggleModality}
        />
      </Dialog>

      {!formDialogOpen ? (
        <CreateFab onClick={openCreateDialog} label="Nova modalidade" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">
              Modalidades cadastradas
            </CardTitle>
            <CardDescription className="break-words">
              {activeCount} ativos em {filteredItems.length} exibido(s).
            </CardDescription>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="session-type-search">Nome da modalidade</Label>
              <Input
                id="session-type-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="session-type-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="session-type-status-filter" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Apenas ativos</SelectItem>
                  <SelectItem value="inactive">Apenas inativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="justify-self-start bg-ama-cyan px-6 text-ama-blue-dark shadow-sm hover:bg-ama-cyan/90 sm:col-span-2 sm:justify-self-end"
              onClick={loadSessionTypes}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando modalidades...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma modalidade encontrada para os filtros informados.
            </p>
          ) : (
            <EntityList>
              {filteredItems.map((item) => (
                <EntityListItem
                  key={item._id}
                  title={item.name}
                  badges={<EntityStatusBadge active={item.isActive} />}
                >
                  <p>
                    <span className="text-foreground/80">Duração padrão:</span>{" "}
                    {item.defaultDurationMinutes} min
                    {item.isDurationFlexible ? " · flexível" : ""}
                  </p>
                  <EntityListItemFooterRow
                    actions={
                      <>
                        <EntityListIconAction
                          icon={Pencil}
                          label="Editar"
                          onClick={() => openEditDialog(item)}
                        />
                        <EntityListIconAction
                          icon={item.isActive ? Trash2 : RotateCcw}
                          label={item.isActive ? "Inativar" : "Reativar"}
                          tone={item.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(item)}
                        />
                      </>
                    }
                  >
                    {(item.allowedModalities ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(item.allowedModalities ?? []).map((modality) => (
                          <EntityTagBadge key={`${item._id}-${modality}`}>
                            {MODALITY_LABELS[modality] ?? modality}
                          </EntityTagBadge>
                        ))}
                      </div>
                    ) : null}
                  </EntityListItemFooterRow>
                </EntityListItem>
              ))}
            </EntityList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
