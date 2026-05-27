import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { CreateFab } from "@/components/cadastros/CreateFab";
import { useSession } from "@/contexts/session-context";
import {
  createRoom,
  listRooms,
  updateRoom,
  updateRoomStatus,
} from "@/services/agenda";

const EMPTY_FORM = { name: "" };

function RoomForm({ form, fieldErrors, saving, isEditing, onSubmit, onCancel, onFormChange }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="room-name">Nome da sala</Label>
        <Input
          id="room-name"
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
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar as salas. Tente novamente.",
      );
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
        err.response?.data?.message ??
          "Não foi possível salvar a sala. Verifique os dados e tente novamente.",
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
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status da sala.",
      );
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
        <RoomForm
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
              <select
                id="room-status-filter"
                className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="active">Apenas ativas</option>
                <option value="inactive">Apenas inativas</option>
                <option value="all">Todas</option>
              </select>
            </div>
            <Button
              className="w-full bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90 sm:col-span-2 sm:w-auto"
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
            <div className="space-y-3">
              {filteredRooms.map((room) => (
                <Card key={room._id} className="min-w-0 overflow-hidden border-ama-cyan/20">
                  <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base break-words text-ama-blue-dark">
                      {room.name}
                    </CardTitle>
                    <Badge
                      variant={room.isActive ? "secondary" : "outline"}
                      className={
                        room.isActive
                          ? "bg-ama-light text-ama-blue-dark"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {room.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 p-4 pt-0 sm:flex-row sm:justify-end">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(room)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleStatus(room)}>
                      {room.isActive ? "Inativar" : "Reativar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
