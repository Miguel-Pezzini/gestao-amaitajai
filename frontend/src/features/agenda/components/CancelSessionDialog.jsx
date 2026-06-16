import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/agenda/components/FieldError";
import { CANCEL_SCOPE_OPTIONS } from "@/features/agenda/utils/recurrence";

export function CancelSessionDialog({
  open,
  setOpen,
  saving,
  cancelReason,
  cancelReasonError,
  cancelScope,
  cancelScopeError,
  hasSeries,
  onCancelReasonChange,
  onCancelScopeChange,
  onSubmit,
  onClose,
  title = "Cancelar sessão",
  description = "Informe o motivo do cancelamento.",
  submitLabel = "Confirmar cancelamento",
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
          return;
        }
        setOpen(true);
      }}
      title={title}
      description={description}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        {hasSeries ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Escopo do cancelamento</legend>
            <div className="space-y-2">
              {CANCEL_SCOPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-ama-cyan/20 px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="cancelScope"
                    value={option.value}
                    checked={cancelScope === option.value}
                    onChange={() => onCancelScopeChange(option.value)}
                    disabled={saving}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <FieldError message={cancelScopeError} />
          </fieldset>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="cancelReason">Motivo</Label>
          <Input
            id="cancelReason"
            value={cancelReason}
            onChange={(event) => onCancelReasonChange(event.target.value)}
            placeholder="Ex.: paciente ausente"
            disabled={saving}
            aria-invalid={Boolean(cancelReasonError)}
          />
          <FieldError message={cancelReasonError} />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={saving}
          >
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Voltar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
