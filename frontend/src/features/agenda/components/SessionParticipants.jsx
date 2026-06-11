import { USER_ROLE_LABELS } from "@/features/cadastros/constants";
import {
  formatApoioSchedule,
  getSessionPatients,
  getSessionProfessionals,
} from "@/features/agenda/utils";

function formatRole(role) {
  return USER_ROLE_LABELS[role] ?? role ?? "";
}

export function SessionParticipantsPreview({ session }) {
  const patients = getSessionPatients(session);
  const professionals = getSessionProfessionals(session);

  if (patients.length === 0 && professionals.length === 0) {
    return null;
  }

  return (
    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
      {patients.length > 0 ? (
        <p className="line-clamp-2">
          <span className="font-medium text-ama-blue-dark/70">Pacientes: </span>
          {patients.map((item) => item.label).join(", ")}
        </p>
      ) : null}
      {professionals.length > 0 ? (
        <p className="line-clamp-2">
          <span className="font-medium text-ama-blue-dark/70">Profissionais: </span>
          {professionals
            .map((item) => {
              const apoioSchedule = formatApoioSchedule(item);
              return apoioSchedule ? `${item.label} (Apoio ${apoioSchedule})` : item.label;
            })
            .join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function ParticipantSection({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function SessionParticipantsDetail({ session }) {
  const patients = getSessionPatients(session);
  const professionals = getSessionProfessionals(session);

  return (
    <div className="space-y-4">
      <ParticipantSection title="Pacientes">
        {patients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum paciente vinculado.</p>
        ) : (
          <ul className="space-y-2">
            {patients.map((patient) => (
              <li
                key={patient.id}
                className="rounded-md border border-ama-cyan/15 bg-ama-light/30 px-3 py-2"
              >
                <p className="text-sm font-medium text-ama-blue-dark">{patient.label}</p>
                {patient.fundingSource ? (
                  <p className="text-xs text-muted-foreground">
                    Fonte de custeio: {patient.fundingSource}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </ParticipantSection>

      <ParticipantSection title="Profissionais">
        {professionals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum profissional vinculado.</p>
        ) : (
          <ul className="space-y-2">
            {professionals.map((professional) => {
              const apoioSchedule = formatApoioSchedule(professional);

              return (
                <li
                  key={professional.id}
                  className="rounded-md border border-ama-cyan/15 bg-ama-light/30 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ama-blue-dark">{professional.label}</p>
                    {professional.isApoio ? (
                      <span className="rounded-full bg-ama-cyan/20 px-2 py-0.5 text-[11px] font-medium text-ama-blue-dark">
                        Apoio
                      </span>
                    ) : null}
                  </div>
                  {apoioSchedule ? (
                    <p className="text-xs text-muted-foreground">Horário: {apoioSchedule}</p>
                  ) : null}
                  {professional.email ? (
                    <p className="text-xs text-muted-foreground">{professional.email}</p>
                  ) : null}
                  {professional.role ? (
                    <p className="text-xs text-muted-foreground">{formatRole(professional.role)}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </ParticipantSection>
    </div>
  );
}
