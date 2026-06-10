import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Pencil, UserCheck, UserX } from "lucide-react";
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
import { CreateFab } from "@/components/cadastros/CreateFab";
import {
  EntityListPagination,
  formatPaginationSummary,
} from "@/components/cadastros/EntityListPagination";
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
import { SELECT_ALL_VALUE } from "@/constants/select";
import { useSession } from "@/contexts/session-context";
import { DeactivatePatientDialog } from "@/features/patients/components/DeactivatePatientDialog";
import { PatientProtocolsDialog } from "@/features/protocols/components/PatientProtocolsDialog";
import { PendingProtocolBadge } from "@/features/protocols/components/PendingProtocolBadge";
import { usePatientDeactivation } from "@/hooks/usePatientDeactivation";
import { listFundingSources } from "@/services/funding-sources";
import { createPatient, listPatients, updatePatient } from "@/services/patients";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  fullName: "",
  birthDate: "",
  guardianName: "",
  phone: "",
  fundingSourceId: "",
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
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    dateStyle: "short",
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

  if (!formData.fundingSourceId) {
    errors.fundingSourceId = "Fonte de custeio é obrigatória.";
  }

  return errors;
}

function PatientForm({
  form,
  fieldErrors,
  saving,
  isEditing,
  fundingOptions,
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
          aria-invalid={Boolean(fieldErrors.birthDate)}
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
        <Label htmlFor="patient-fundingSourceId">Fonte de custeio</Label>
        <Select
          value={form.fundingSourceId}
          onValueChange={(value) => onFormChange("fundingSourceId", value)}
          disabled={saving || fundingOptions.length === 0}
        >
          <SelectTrigger id="patient-fundingSourceId" className="w-full">
            <SelectValue
              placeholder={
                fundingOptions.length === 0
                  ? "Nenhuma fonte ativa cadastrada"
                  : "Selecione a fonte"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {fundingOptions.map((option) => (
              <SelectItem key={option._id} value={option._id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.fundingSourceId ? (
          <p className="text-sm text-destructive">{fieldErrors.fundingSourceId}</p>
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [fundingSources, setFundingSources] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [protocolsPatient, setProtocolsPatient] = useState(null);
  const [protocolsDialogOpen, setProtocolsDialogOpen] = useState(false);

  const isEditing = Boolean(editingId);

  const activeFundingSources = useMemo(
    () => fundingSources.filter((item) => item.isActive),
    [fundingSources],
  );

  const formFundingOptions = useMemo(() => {
    if (!isEditing) {
      return activeFundingSources;
    }

    const current = fundingSources.find((item) => item._id === form.fundingSourceId);
    if (!current || activeFundingSources.some((item) => item._id === current._id)) {
      return activeFundingSources;
    }

    return [...activeFundingSources, current];
  }, [isEditing, form.fundingSourceId, activeFundingSources, fundingSources]);

  async function loadFundingSources() {
    try {
      const response = await listFundingSources();
      setFundingSources(response.items ?? []);
    } catch {
      setFundingSources([]);
    }
  }

  async function loadPatients(targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const response = await listPatients({
        search: search || undefined,
        fundingSourceId: fundingFilter || undefined,
        status: statusFilter,
        page: targetPage,
        limit: PAGE_SIZE,
      });
      setPatients(response.items ?? []);
      setPagination(response.pagination ?? null);
      setPage(targetPage);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Não foi possível carregar os pacientes. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const deactivation = usePatientDeactivation({ onCompleted: loadPatients });

  useEffect(() => {
    loadFundingSources();
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    loadPatients(1);
  }

  function handlePageChange(nextPage) {
    loadPatients(nextPage);
  }

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
    setForm({
      ...EMPTY_FORM,
      fundingSourceId: activeFundingSources[0]?._id ?? "",
    });
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
      fundingSourceId: patient.fundingSourceId ?? activeFundingSources[0]?._id ?? "",
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

  function openProtocolsDialog(patient) {
    setProtocolsPatient(patient);
    setProtocolsDialogOpen(true);
  }

  function closeProtocolsDialog() {
    setProtocolsDialogOpen(false);
    setProtocolsPatient(null);
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

      <PatientProtocolsDialog
        patient={protocolsPatient}
        open={protocolsDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeProtocolsDialog();
        }}
        onChanged={loadPatients}
      />

      <DeactivatePatientDialog
        open={deactivation.dialogOpen}
        patient={deactivation.patient}
        impact={deactivation.impact}
        selections={deactivation.selections}
        selectionLabels={deactivation.selectionLabels}
        selectionErrors={deactivation.selectionErrors}
        saving={deactivation.saving}
        error={deactivation.error}
        onSelectionChange={deactivation.handleSelectionChange}
        onClose={deactivation.closeDialog}
        onConfirm={deactivation.confirmDeactivation}
      />

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
          fundingOptions={formFundingOptions}
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
              {loading && !pagination
                ? "Carregando..."
                : formatPaginationSummary(pagination)}
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
              <Select
                value={fundingFilter || SELECT_ALL_VALUE}
                onValueChange={(value) =>
                  setFundingFilter(value === SELECT_ALL_VALUE ? "" : value)
                }
              >
                <SelectTrigger id="patient-funding-filter" className="w-full">
                  <SelectValue placeholder="Todas as fontes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL_VALUE}>Todas as fontes</SelectItem>
                  {fundingSources.map((option) => (
                    <SelectItem key={option._id} value={option._id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="patient-status-filter" className="w-full">
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
              onClick={handleSearch}
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
            <EntityList>
              {patients.map((patient) => (
                <EntityListItem
                  key={patient._id}
                  title={
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>{patient.fullName}</span>
                      {patient.pendingProtocolCount > 0 ? (
                        <PendingProtocolBadge count={patient.pendingProtocolCount} />
                      ) : null}
                    </span>
                  }
                  badges={
                    <>
                      <EntityTagBadge>{patient.fundingSource}</EntityTagBadge>
                      <EntityStatusBadge active={patient.isActive} />
                    </>
                  }
                >
                  <p className="break-words">
                    <span className="text-foreground/80">Responsável:</span>{" "}
                    {patient.guardianName}
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-foreground/80">Telefone:</span> {patient.phone}
                  </p>
                  <EntityListItemFooterRow
                    actions={
                      <>
                        <EntityListIconAction
                          icon={ClipboardList}
                          label="Protocolos"
                          onClick={() => openProtocolsDialog(patient)}
                        />
                        <EntityListIconAction
                          icon={Pencil}
                          label="Editar"
                          onClick={() => openEditDialog(patient)}
                        />
                        <EntityListIconAction
                          icon={patient.isActive ? UserX : UserCheck}
                          label={patient.isActive ? "Inativar" : "Reativar"}
                          tone={patient.isActive ? "destructive" : "default"}
                          onClick={() => deactivation.handleToggleStatus(patient)}
                          disabled={deactivation.loadingImpact || deactivation.saving}
                        />
                      </>
                    }
                  >
                    <p>
                      <span className="text-foreground/80">Nascimento:</span>{" "}
                      {formatBirthDatePtBr(patient.birthDate)}
                    </p>
                  </EntityListItemFooterRow>
                </EntityListItem>
              ))}
            </EntityList>
          )}
          <EntityListPagination
            pagination={pagination}
            loading={loading}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
