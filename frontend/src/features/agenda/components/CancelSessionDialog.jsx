import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CancelSessionDialog({
  open,
  setOpen,
  saving,
  cancelReason,
  setCancelReason,
  onSubmit,
  onClose,
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
      title="Cancelar sessão"
      description="Informe o motivo do cancelamento."
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="cancelReason">Motivo</Label>
          <Input
            id="cancelReason"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Ex.: paciente ausente"
            disabled={saving}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={saving || !cancelReason.trim()}
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
