import { useEffect, useState } from "react";
import { SessionModalitySettingsSkeleton } from "@/components/cadastros/SessionModalitySettingsSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { MODALITY_LABELS } from "@/features/cadastros/constants";
import { useToast } from "@/contexts/toast-context";
import { listSessionModalities, updateSessionModality } from "@/services/agenda";

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function buildFieldErrors(values) {
  const errors = {};
  if (values.maxPatients < values.minPatients) {
    errors.patients = "Máximo de pacientes deve ser maior ou igual ao mínimo.";
  }
  if (values.maxProfessionals < values.minProfessionals) {
    errors.professionals = "Máximo de profissionais deve ser maior ou igual ao mínimo.";
  }
  return errors;
}

export function TiposSessaoPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingModality, setSavingModality] = useState("");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState([]);
  const [forms, setForms] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const response = await listSessionModalities();
      const items = response.items ?? [];
      setSettings(items);
      const initialForms = {};
      items.forEach((item) => {
        initialForms[item.modality] = {
          minPatients: String(item.minPatients),
          maxPatients: String(item.maxPatients),
          minProfessionals: String(item.minProfessionals),
          maxProfessionals: String(item.maxProfessionals),
          isActive: Boolean(item.isActive),
        };
      });
      setForms(initialForms);
      setFieldErrors({});
    } catch (err) {
      setError(err.response?.data?.message ?? "Não foi possível carregar os tipos de sessão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleFormChange(modality, field, value) {
    setForms((current) => ({
      ...current,
      [modality]: {
        ...current[modality],
        [field]: value,
      },
    }));
    setFieldErrors((current) => ({
      ...current,
      [modality]: { ...current[modality], [field]: "" },
    }));
  }

  async function handleSave(modality) {
    const form = forms[modality];
    const payload = {
      minPatients: parsePositiveInt(form?.minPatients),
      maxPatients: parsePositiveInt(form?.maxPatients),
      minProfessionals: parsePositiveInt(form?.minProfessionals),
      maxProfessionals: parsePositiveInt(form?.maxProfessionals),
      isActive: Boolean(form?.isActive),
    };

    if (
      payload.minPatients <= 0 ||
      payload.maxPatients <= 0 ||
      payload.minProfessionals <= 0 ||
      payload.maxProfessionals <= 0
    ) {
      setFieldErrors((current) => ({
        ...current,
        [modality]: {
          patients: "Informe limites maiores que zero.",
          professionals: "Informe limites maiores que zero.",
        },
      }));
      return;
    }

    const errors = buildFieldErrors(payload);
    if (Object.keys(errors).length > 0) {
      setFieldErrors((current) => ({ ...current, [modality]: errors }));
      return;
    }

    setSavingModality(modality);
    try {
      await updateSessionModality(modality, payload);
      toast.success("Limites salvos com sucesso.");
      await loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Não foi possível salvar os limites.");
    } finally {
      setSavingModality("");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-ama-cyan/30">
        <CardHeader className="gap-2 p-4 sm:gap-4 sm:p-6">
          <CardTitle className="text-lg tracking-tight text-ama-text sm:text-xl">
            Tipos de sessão
          </CardTitle>
          <CardDescription>
            Configure limites mínimos e máximos de pacientes e profissionais para cada tipo de sessão.
          </CardDescription>
        </CardHeader>
      </Card>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {loading ? (
        <SessionModalitySettingsSkeleton />
      ) : (
        <div className="space-y-3">
          {settings.map((item) => {
            const form = forms[item.modality] ?? {};
            const errors = fieldErrors[item.modality] ?? {};
            const isSaving = savingModality === item.modality;
            return (
              <Card key={item.modality} className="border-ama-cyan/20">
                <CardHeader className="p-4">
                  <CardTitle className="text-base text-ama-blue-dark">
                    {MODALITY_LABELS[item.modality] ?? item.modality}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mínimo de pacientes</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.minPatients ?? ""}
                        onChange={(event) =>
                          handleFormChange(item.modality, "minPatients", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo de pacientes</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.maxPatients ?? ""}
                        onChange={(event) =>
                          handleFormChange(item.modality, "maxPatients", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mínimo de profissionais</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.minProfessionals ?? ""}
                        onChange={(event) =>
                          handleFormChange(item.modality, "minProfessionals", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo de profissionais</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.maxProfessionals ?? ""}
                        onChange={(event) =>
                          handleFormChange(item.modality, "maxProfessionals", event.target.value)
                        }
                      />
                    </div>
                  </div>
                  {errors.patients ? <p className="text-sm text-destructive">{errors.patients}</p> : null}
                  {errors.professionals ? (
                    <p className="text-sm text-destructive">{errors.professionals}</p>
                  ) : null}
                  <Button
                    onClick={() => handleSave(item.modality)}
                    disabled={isSaving}
                    className="bg-ama-cyan text-ama-blue-dark hover:bg-ama-cyan/90"
                  >
                    {isSaving ? (
                      <>
                        <Spinner size="sm" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar limites"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
