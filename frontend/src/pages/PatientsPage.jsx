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
import { CreateFab } from "@/components/cadastros/CreateFab";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/session-context";
import {
  createPatient,
  listPatients,
  updatePatient,
  updatePatientStatus,
} from "@/services/patients";

const FUNDING_OPTIONS = ["Municipal", "Estadual", "Particular"];

const EMPTY_FORM = {
  fullName: "",
  birthDate: "",
  guardianName: "",
  phone: "",
  fundingSource: "Municipal",
};

function formatPhone(value) {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isPhoneValid(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function isBirthDateValid(value) {
  if (!value) {
    return false;
  }

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const now = new Date();
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 120);
  return birthDate <= now && birthDate >= minDate;
}

function formatBirthDatePtBr(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function normalizeFormData(formData) {
  return {
    ...formData,
    fullName: formData.fullName.trim(),
    guardianName: formData.guardianName.trim(),
    phone: formatPhone(formData.phone),
  };
}

function validatePatientForm(formData) {
  const errors = {};

  if (!formData.fullName) {
    errors.fullName = "Nome completo é obrigatório.";
  }

  if (!formData.birthDate) {
    errors.birthDate = "Data de nascimento é obrigatória.";
  } else if (!isBirthDateValid(formData.birthDate)) {
    errors.birthDate =
      "Data de nascimento inválida. Não pode ser futura nem superior a 120 anos.";
  }

  if (!formData.guardianName) {
    errors.guardianName = "Nome do responsável é obrigatório.";
  }

  if (!formData.phone) {
    errors.phone = "Telefone de contato é obrigatório.";
  } else if (!isPhoneValid(formData.phone)) {
    errors.phone = "Telefone inválido. Use DDD + número com 10 ou 11 dígitos.";
  }

  if (!formData.fundingSource) {
    errors.fundingSource = "Fonte de custeio é obrigatória.";
  }

  return errors;
}

function PatientForm({
  form,
  fieldErrors,
  saving,
  isEditing,
  onSubmit,
  onCancel,
  onFormChange,
  onPhoneChange,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="patient-fullName">Nome completo</Label>
        <Input
          id="patient-fullName"
          value={form.fullName}
          onChange={(event) => onFormChange("fullName", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.fullName ? (
          <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-birthDate">Data de nascimento</Label>
        <Input
          id="patient-birthDate"
          type="date"
          value={form.birthDate}
          onChange={(event) => onFormChange("birthDate", event.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          disabled={saving}
        />
        {fieldErrors.birthDate ? (
          <p className="text-sm text-destructive">{fieldErrors.birthDate}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-guardianName">Responsável</Label>
        <Input
          id="patient-guardianName"
          value={form.guardianName}
          onChange={(event) => onFormChange("guardianName", event.target.value)}
          disabled={saving}
        />
        {fieldErrors.guardianName ? (
          <p className="text-sm text-destructive">{fieldErrors.guardianName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-phone">Telefone</Label>
        <Input
          id="patient-phone"
          value={form.phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          inputMode="numeric"
          disabled={saving}
        />
        {fieldErrors.phone ? (
          <p className="text-sm text-destructive">{fieldErrors.phone}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-fundingSource">Fonte de custeio</Label>
        <select
          id="patient-fundingSource"
          className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.fundingSource}
          onChange={(event) => onFormChange("fundingSource", event.target.value)}
          disabled={saving}
        >
          {FUNDING_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {fieldErrors.fundingSource ? (
          <p className="text-sm text-destructive">{fieldErrors.fundingSource}</p>
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

export function PatientsPage() {
  const { userName } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fundingFilter, setFundingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [patients, setPatients] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  async function loadPatients() {
    setLoading(true);
    setError("");
    try {
      const response = await listPatients({
        search: search || undefined,
        fundingSource: fundingFilter || undefined,
        status: statusFilter,
      });
      setPatients(response.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar os pacientes. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = useMemo(
    () => patients.filter((patient) => patient.isActive).length,
    [patients],
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

  function openEditDialog(patient) {
    setEditingId(patient._id);
    setFieldErrors({});
    setForm({
      fullName: patient.fullName ?? "",
      birthDate: patient.birthDate ? String(patient.birthDate).slice(0, 10) : "",
      guardianName: patient.guardianName ?? "",
      phone: formatPhone(patient.phone ?? ""),
      fundingSource: patient.fundingSource ?? "Municipal",
    });
    setFormDialogOpen(true);
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  function handlePhoneChange(value) {
    handleFormChange("phone", formatPhone(value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = normalizeFormData(form);
    const validationErrors = validatePatientForm(payload);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSaving(false);
      return;
    }
    setFieldErrors({});

    try {
      if (isEditing) {
        await updatePatient(editingId, payload);
      } else {
        await createPatient(payload);
      }
      closeFormDialog();
      await loadPatients();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível salvar o paciente. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(patient) {
    setError("");
    try {
      await updatePatientStatus(patient._id, !patient.isActive);
      await loadPatients();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status do paciente.",
      );
    }
  }

  return (
    <div className="relative min-w-0 space-y-4 pb-24 sm:space-y-6">
      <Card className="overflow-hidden border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Pacientes
          </CardTitle>
          <CardDescription className="mt-1 break-words sm:mt-2">
            Olá, {userName}. Cadastre e mantenha pacientes para os módulos de Agenda,
            Presença, Check-in e Fila.
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
        title={isEditing ? "Editar paciente" : "Novo paciente"}
        description={
          isEditing
            ? "Atualize os dados cadastrais do paciente."
            : "Preencha os dados mínimos do cadastro."
        }
      >
        <PatientForm
          form={form}
          fieldErrors={fieldErrors}
          saving={saving}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onCancel={closeFormDialog}
          onFormChange={handleFormChange}
          onPhoneChange={handlePhoneChange}
        />
      </Dialog>

      {!formDialogOpen ? (
        <CreateFab onClick={openCreateDialog} label="Novo paciente" />
      ) : null}

      <Card className="min-w-0 overflow-hidden border-ama-cyan/30">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="min-w-0">
            <CardTitle className="text-base text-ama-blue-dark">
              Pacientes cadastrados
            </CardTitle>
            <CardDescription className="break-words">
              {activeCount} ativos em {patients.length} carregado(s).
            </CardDescription>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patient-search">Nome ou responsável</Label>
              <Input
                id="patient-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-funding-filter">Fonte de custeio</Label>
              <select
                id="patient-funding-filter"
                className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={fundingFilter}
                onChange={(event) => setFundingFilter(event.target.value)}
              >
                <option value="">Todas as fontes</option>
                {FUNDING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-status-filter">Status</Label>
              <select
                id="patient-status-filter"
                className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="active">Apenas ativos</option>
                <option value="inactive">Apenas inativos</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <Button
              className="w-full bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90 sm:col-span-2 sm:w-auto"
              onClick={loadPatients}
              disabled={loading}
            >
              Buscar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando pacientes...</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum paciente encontrado para os filtros informados.
            </p>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <Card key={patient._id} className="min-w-0 overflow-hidden border-ama-cyan/20">
                  <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 space-y-2">
                      <CardTitle className="text-base break-words text-ama-blue-dark">
                        {patient.fullName}
                      </CardTitle>
                      <CardDescription className="break-words">
                        <span className="block sm:inline">
                          Responsável: {patient.guardianName}
                        </span>
                        <span className="hidden sm:inline"> · </span>
                        <span className="block sm:inline">Telefone: {patient.phone}</span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-row flex-wrap gap-2 sm:flex-col sm:items-end">
                      <Badge variant="outline" className="border-ama-cyan text-ama-blue">
                        {patient.fundingSource}
                      </Badge>
                      <Badge
                        variant={patient.isActive ? "secondary" : "outline"}
                        className={
                          patient.isActive
                            ? "bg-ama-light text-ama-blue-dark"
                            : "border-muted-foreground/30 text-muted-foreground"
                        }
                      >
                        {patient.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs break-words text-muted-foreground">
                      Nascimento: {formatBirthDatePtBr(patient.birthDate)}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => openEditDialog(patient)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => handleToggleStatus(patient)}
                      >
                        {patient.isActive ? "Inativar" : "Reativar"}
                      </Button>
                    </div>
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
