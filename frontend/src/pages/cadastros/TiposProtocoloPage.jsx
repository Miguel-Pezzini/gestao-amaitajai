import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
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
  createProtocolType,
  listProtocolTypes,
  updateProtocolType,
  updateProtocolTypeStatus,
} from "@/services/protocols";
import { getApiErrorMessage } from "@/lib/api-error";

const EMPTY_FORM = { name: "" };

export function TiposProtocoloPage() {
  const { userName } = useSession();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [protocolTypes, setProtocolTypes] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadProtocolTypes() {
    setLoading(true);
    setError("");
    try {
      const response = await listProtocolTypes();
      setProtocolTypes(response.items ?? []);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar os tipos de protocolo. Tente novamente."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProtocolTypes();
  }, []);

  const filteredTypes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return protocolTypes.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!term) return true;
      return String(item.name ?? "").toLowerCase().includes(term);
    });
  }, [protocolTypes, search, statusFilter]);

  const activeCount = useMemo(
    () => filteredTypes.filter((item) => item.isActive).length,
    [filteredTypes],
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

  function openEditDialog(protocolType) {
    setEditingId(protocolType._id);
    setFieldErrors({});
    setForm({ name: protocolType.name ?? "" });
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
      setFieldErrors({ name: "Nome do tipo é obrigatório." });
      setSaving(false);
      return;
    }

    setFieldErrors({});

    try {
      if (isEditing) {
        await updateProtocolType(editingId, { name });
        toast.success("Tipo de protocolo atualizado com sucesso.");
      } else {
        await createProtocolType({ name });
        toast.success("Tipo de protocolo cadastrado com sucesso.");
      }
      closeFormDialog();
      await loadProtocolTypes();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Não foi possível salvar o tipo de protocolo. Verifique os dados e tente novamente.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(protocolType) {
    try {
      await updateProtocolTypeStatus(protocolType._id, !protocolType.isActive);
      toast.success(
        protocolType.isActive
          ? "Tipo de protocolo inativado com sucesso."
          : "Tipo de protocolo reativado com sucesso.",
      );
      await loadProtocolTypes();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Não foi possível atualizar o status do tipo de protocolo."),
      );
    }
  }

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Tipos de protocolo
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Cadastre os tipos de solicitação usados nos protocolos dos atendidos.
          </CardDescription>
        </CardHeader>
      </Card>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
        title={isEditing ? "Editar tipo de protocolo" : "Novo tipo de protocolo"}
        description={
          isEditing
            ? "Altere o nome exibido ao abrir protocolos."
            : "Informe o nome do novo tipo de solicitação."
        }
      >
        <EntityNameForm
          id="protocol-type-name"
          label="Nome do tipo"
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
        <CreateFab onClick={openCreateDialog} label="Novo tipo" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">Tipos cadastrados</CardTitle>
            <CardDescription className="break-words">
              {activeCount} ativo(s) em {filteredTypes.length} exibido(s).
            </CardDescription>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="protocol-type-search">Nome do tipo</Label>
              <Input
                id="protocol-type-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="protocol-type-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="protocol-type-status-filter" className="w-full">
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
              onClick={loadProtocolTypes}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <ListSkeleton />
          ) : protocolTypes.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhum tipo cadastrado"
              description="Cadastre tipos de solicitação para usar nos protocolos dos atendidos."
              actionLabel="Cadastrar tipo"
              onAction={openCreateDialog}
            />
          ) : filteredTypes.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado"
              description="Nenhum tipo encontrado para os filtros informados."
              actionLabel="Limpar filtros"
              onAction={clearFilters}
            />
          ) : (
            <EntityList>
              {filteredTypes.map((protocolType) => (
                <EntityListItem
                  key={protocolType._id}
                  title={protocolType.name}
                  badges={
                    <EntityStatusBadge
                      active={protocolType.isActive}
                      activeLabel="Ativo"
                      inactiveLabel="Inativo"
                    />
                  }
                >
                  <EntityListItemFooterRow
                    actions={
                      <>
                        <EntityListIconAction
                          icon={Pencil}
                          label="Editar"
                          onClick={() => openEditDialog(protocolType)}
                        />
                        <EntityListIconAction
                          icon={protocolType.isActive ? Trash2 : RotateCcw}
                          label={protocolType.isActive ? "Inativar" : "Reativar"}
                          tone={protocolType.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(protocolType)}
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
