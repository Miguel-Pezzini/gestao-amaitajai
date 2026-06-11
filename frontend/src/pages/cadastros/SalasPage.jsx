import { useEffect, useMemo, useState } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
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
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createRoom,
  listRooms,
  updateRoom,
  updateRoomStatus,
} from "@/services/agenda";

const EMPTY_FORM = { name: "" };

export function SalasPage() {
  const { userName } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [rooms, setRooms] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadRooms() {
    setLoading(true);
    setError("");
    try {
      const response = await listRooms();
      setRooms(response.items ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar as salas. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (statusFilter === "active" && !room.isActive) return false;
      if (statusFilter === "inactive" && room.isActive) return false;
      if (!term) return true;
      return String(room.name ?? "").toLowerCase().includes(term);
    });
  }, [rooms, search, statusFilter]);

  const activeCount = useMemo(
    () => filteredRooms.filter((room) => room.isActive).length,
    [filteredRooms],
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

  function openEditDialog(room) {
    setEditingId(room._id);
    setFieldErrors({});
    setForm({ name: room.name ?? "" });
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
      setFieldErrors({ name: "Nome da sala é obrigatório." });
      setSaving(false);
      return;
    }

    setFieldErrors({});

    try {
      if (isEditing) {
        await updateRoom(editingId, { name });
      } else {
        await createRoom({ name });
      }
      closeFormDialog();
      await loadRooms();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível salvar a sala. Verifique os dados e tente novamente."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(room) {
    setError("");
    try {
      await updateRoomStatus(room._id, !room.isActive);
      await loadRooms();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível atualizar o status da sala."));
    }
  }

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Salas
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Cadastre e gerencie salas utilizadas na agenda.
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
        title={isEditing ? "Editar sala" : "Nova sala"}
        description={isEditing ? "Altere o nome da sala." : "Informe o nome da nova sala."}
      >
        <EntityNameForm
          id="room-name"
          label="Nome da sala"
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
        <CreateFab onClick={openCreateDialog} label="Nova sala" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">Salas cadastradas</CardTitle>
            <CardDescription className="break-words">
              {activeCount} ativas em {filteredRooms.length} exibida(s).
            </CardDescription>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-search">Nome da sala</Label>
              <Input
                id="room-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="room-status-filter" className="w-full">
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
              onClick={loadRooms}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando salas...</p>
          ) : filteredRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sala encontrada para os filtros informados.
            </p>
          ) : (
            <EntityList>
              {filteredRooms.map((room) => (
                <EntityListItem
                  key={room._id}
                  title={room.name}
                  badges={
                    <EntityStatusBadge
                      active={room.isActive}
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
                          onClick={() => openEditDialog(room)}
                        />
                        <EntityListIconAction
                          icon={room.isActive ? Trash2 : RotateCcw}
                          label={room.isActive ? "Inativar" : "Reativar"}
                          tone={room.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(room)}
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
