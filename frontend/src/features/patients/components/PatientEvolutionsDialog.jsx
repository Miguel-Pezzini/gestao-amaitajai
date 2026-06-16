import { Dialog } from "@/components/ui/dialog";
import { EvolutionHistorySection } from "@/features/patients/components/EvolutionHistorySection";

const PAGE_SIZE = 10;

export function PatientEvolutionsDialog({ patient, open, onOpenChange }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Evoluções — ${patient?.fullName ?? ""}`}
      description="Histórico de evoluções clínicas registradas em atendimentos."
      className="sm:max-w-3xl"
    >
      <EvolutionHistorySection
        patientId={patient?._id}
        enabled={open}
        pageSize={PAGE_SIZE}
        listClassName="max-h-[28rem]"
      />
    </Dialog>
  );
}
