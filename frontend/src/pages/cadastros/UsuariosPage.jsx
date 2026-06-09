import { useEffect, useMemo, useState } from "react";
import { Pencil, UserCheck, UserX } from "lucide-react";
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
import { SELECT_ALL_VALUE } from "@/constants/select";
import { useSession } from "@/contexts/session-context";
import {
  USER_ROLE_LABELS,
  USER_ROLE_OPTIONS,
} from "@/features/cadastros/constants";
import {
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
} from "@/services/users";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "TECNICO",
};

function UserForm({ form, fieldErrors, saving, isEditing, onSubmit, onCancel, onFormChange }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="user-name">Nome</Label>
        <Input
          id="user-name"
          value={form.name}
          onChange={(event) => onFormChange("name", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.name ? (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">E-mail</Label>
        <Input
          id="user-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => onFormChange("email", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.email ? (
          <p className="text-sm text-destructive">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role">Perfil de acesso</Label>
        <Select
          value={form.role}
          onValueChange={(value) => onFormChange("role", value)}
          disabled={saving}
        >
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue placeholder="Selecione o perfil" />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {USER_ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.role ? (
          <p className="text-sm text-destructive">{fieldErrors.role}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-password">
          {isEditing ? "Nova senha (opcional)" : "Senha inicial"}
        </Label>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => onFormChange("password", event.target.value)}
          disabled={saving}
        />
        {isEditing ? (
          <p className="text-xs text-muted-foreground">
            Deixe em branco para manter a senha atual.
          </p>
        ) : null}
        {fieldErrors.password ? (
          <p className="text-sm text-destructive">{fieldErrors.password}</p>
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

function validateUserForm(form, { isEditing }) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Nome é obrigatório.";
  }

  const email = form.email.trim();
  if (!email || !email.includes("@")) {
    errors.email = "E-mail inválido.";
  }

  if (!USER_ROLE_OPTIONS.includes(form.role)) {
    errors.role = "Perfil inválido.";
  }

  const password = form.password.trim();
  if (!isEditing && password.length < 6) {
    errors.password = "Senha obrigatória com no mínimo 6 caracteres.";
  } else if (isEditing && password && password.length < 6) {
    errors.password = "A nova senha deve ter no mínimo 6 caracteres.";
  }

  return errors;
}

function buildPayload(form, { isEditing }) {
  const payload = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    role: form.role,
  };

  const password = form.password.trim();
  if (!isEditing || password) {
    payload.password = password;
  }

  return payload;
}

export function UsuariosPage() {
  const { user, userName } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter,
        limit: 100,
      });
      setUsers(response.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar os funcionários. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = useMemo(
    () => users.filter((item) => item.accountStatus === "ATIVO").length,
    [users],
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

  function openEditDialog(item) {
    setEditingId(item._id);
    setFieldErrors({});
    setForm({
      name: item.name ?? "",
      email: item.email ?? "",
      password: "",
      role: item.role ?? "TECNICO",
    });
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

    const validationErrors = validateUserForm(form, { isEditing });
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSaving(false);
      return;
    }

    setFieldErrors({});
    const payload = buildPayload(form, { isEditing });

    try {
      if (isEditing) {
        await updateUser(editingId, payload);
      } else {
        await createUser(payload);
      }
      closeFormDialog();
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível salvar o funcionário. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(item, nextStatus) {
    setError("");
    try {
      await updateUserStatus(item._id, nextStatus);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status do funcionário.",
      );
    }
  }

  const currentUserId = user?._id ?? user?.id;

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Funcionários
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Cadastre funcionários e defina perfis de acesso ao sistema.
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
        title={isEditing ? "Editar funcionário" : "Novo funcionário"}
        description="Informe nome, e-mail, perfil e senha de acesso."
      >
        <UserForm
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
        <CreateFab onClick={openCreateDialog} label="Novo funcionário" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">Funcionários cadastrados</CardTitle>
            <CardDescription className="break-words">
              {activeCount} ativos em {users.length} carregado(s).
            </CardDescription>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="user-search">Nome ou e-mail</Label>
              <Input
                id="user-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role-filter">Perfil</Label>
              <Select
                value={roleFilter || SELECT_ALL_VALUE}
                onValueChange={(value) =>
                  setRoleFilter(value === SELECT_ALL_VALUE ? "" : value)
                }
              >
                <SelectTrigger id="user-role-filter" className="w-full">
                  <SelectValue placeholder="Todos os perfis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL_VALUE}>Todos os perfis</SelectItem>
                  {USER_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="user-status-filter" className="w-full">
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
              onClick={loadUsers}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando funcionários...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum funcionário encontrado para os filtros informados.
            </p>
          ) : (
            <EntityList>
              {users.map((item) => {
                const isSelf = String(item._id) === String(currentUserId);

                return (
                  <EntityListItem
                    key={item._id}
                    title={
                      <>
                        {item.name}
                        {isSelf ? (
                          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                            (você)
                          </span>
                        ) : null}
                      </>
                    }
                    badges={
                      <>
                        <EntityTagBadge>
                          {USER_ROLE_LABELS[item.role] ?? item.role}
                        </EntityTagBadge>
                        <EntityStatusBadge status={item.accountStatus ?? "ATIVO"} />
                      </>
                    }
                  >
                    <EntityListItemFooterRow
                      actions={
                        <>
                          <EntityListIconAction
                            icon={Pencil}
                            label="Editar"
                            onClick={() => openEditDialog(item)}
                          />
                          <EntityListIconAction
                            icon={item.accountStatus === "ATIVO" ? UserX : UserCheck}
                            label={item.accountStatus === "ATIVO" ? "Inativar" : "Reativar"}
                            tone={item.accountStatus === "ATIVO" ? "destructive" : "default"}
                            onClick={() =>
                              handleStatusChange(
                                item,
                                item.accountStatus === "ATIVO" ? "INATIVO" : "ATIVO",
                              )
                            }
                            disabled={isSelf && item.accountStatus === "ATIVO"}
                          />
                        </>
                      }
                    >
                      <p className="break-words">{item.email}</p>
                    </EntityListItemFooterRow>
                  </EntityListItem>
                );
              })}
            </EntityList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
