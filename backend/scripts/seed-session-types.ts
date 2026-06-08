import "dotenv/config";
import type { SessionModality } from "@prisma/client";
import { prisma } from "../src/db/prisma.js";

const INDIVIDUAL_DUPLA_GRUPO: SessionModality[] = ["INDIVIDUAL", "DUPLA", "GRUPO"];
const GRUPO_ONLY: SessionModality[] = ["GRUPO"];

/** Modalidades de atendimento (SessionType) conforme regras da ONG. */
const SESSION_TYPES: Array<{
  name: string;
  slug: string;
  defaultDurationMinutes: number;
  isDurationFlexible: boolean;
  allowedModalities: SessionModality[];
}> = [
  {
    name: "PSICOPED",
    slug: "psicoped",
    defaultDurationMinutes: 30,
    isDurationFlexible: false,
    allowedModalities: INDIVIDUAL_DUPLA_GRUPO,
  },
  {
    name: "INTENSIVO",
    slug: "intensivo",
    defaultDurationMinutes: 60,
    isDurationFlexible: true,
    allowedModalities: INDIVIDUAL_DUPLA_GRUPO,
  },
  {
    name: "INTERVENÇÃO PRECOCE",
    slug: "intervencao-precoce",
    defaultDurationMinutes: 90,
    isDurationFlexible: false,
    allowedModalities: INDIVIDUAL_DUPLA_GRUPO,
  },
  {
    name: "Grupo de Habilidades Sociais",
    slug: "grupo-habilidades-sociais",
    defaultDurationMinutes: 60,
    isDurationFlexible: false,
    allowedModalities: INDIVIDUAL_DUPLA_GRUPO,
  },
  {
    name: "TEA 14+",
    slug: "tea-14-plus",
    defaultDurationMinutes: 120,
    isDurationFlexible: false,
    allowedModalities: GRUPO_ONLY,
  },
  {
    name: "Trilhar",
    slug: "trilhar",
    defaultDurationMinutes: 60,
    isDurationFlexible: false,
    allowedModalities: INDIVIDUAL_DUPLA_GRUPO,
  },
];

async function main(): Promise<void> {
  console.log("Cadastrando modalidades de atendimento...\n");

  for (const type of SESSION_TYPES) {
    const sessionType = await prisma.sessionType.upsert({
      where: { slug: type.slug },
      create: {
        ...type,
        isActive: true,
      },
      update: {
        name: type.name,
        defaultDurationMinutes: type.defaultDurationMinutes,
        isDurationFlexible: type.isDurationFlexible,
        allowedModalities: type.allowedModalities,
        isActive: true,
      },
    });

    const modalities = sessionType.allowedModalities.join(", ");
    console.log(
      `  ${sessionType.name} — ${sessionType.defaultDurationMinutes} min — [${modalities}]`,
    );
  }

  console.log("\nConcluído. Trilhar: expectativa de 2x/semana é referência de negócio (ainda sem campo no sistema).");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao cadastrar modalidades:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
