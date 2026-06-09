import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CancelProtocolDialog({
  open,
  saving,
  cancelReason,
  cancelReasonError,
  onCancelReasonChange,
  onSubmit,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
      title="Cancelar protocolo"
      description="Informe a justificativa do cancelamento."
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="protocol-cancel-reason">Justificativa</Label>
          <Input
            id="protocol-cancel-reason"
            value={cancelReason}
            onChange={(event) => onCancelReasonChange(event.target.value)}
            placeholder="Ex.: solicitação duplicada"
            disabled={saving}
            aria-invalid={Boolean(cancelReasonError)}
          />
          {cancelReasonError ? (
            <p className="text-sm text-destructive">{cancelReasonError}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={saving}
          >
            Confirmar cancelamento
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Voltar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
