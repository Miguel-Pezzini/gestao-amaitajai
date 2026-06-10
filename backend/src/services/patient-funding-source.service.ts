import { prisma } from "../db/prisma.js";
import { isPrismaUniqueViolation } from "../db/errors.js";
import { withMongoId, withMongoIdList } from "../db/serialize.js";
import { ConflictError, NotFoundError } from "../errors/http-errors.js";
import {
  validateCreatePatientFundingSource,
  validateIsActive,
  validatePatientFundingSourceId,
  validateUpdatePatientFundingSource,
} from "../validators/patient/patient-funding-source.validator.js";

function serializePatientFundingSource(fundingSource: {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return withMongoId(fundingSource);
}

export class PatientFundingSourceService {
  async listFundingSources() {
    const items = await prisma.patientFundingSource.findMany({ orderBy: { name: "asc" } });
    return { items: withMongoIdList(items) };
  }

  async createFundingSource(payload: { name?: unknown }) {
    const { name } = validateCreatePatientFundingSource(payload);

    try {
      const fundingSource = await prisma.patientFundingSource.create({ data: { name } });
      return { fundingSource: serializePatientFundingSource(fundingSource) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Já existe uma fonte de custeio com este nome.");
      }
      throw error;
    }
  }

  async updateFundingSource(fundingSourceId: string, payload: { name?: unknown }) {
    const updates = validateUpdatePatientFundingSource(fundingSourceId, payload);
    await this.findFundingSourceOrThrow(fundingSourceId);

    if (!updates.name) {
      const fundingSource = await prisma.patientFundingSource.findUniqueOrThrow({
        where: { id: fundingSourceId },
      });
      return { fundingSource: serializePatientFundingSource(fundingSource) };
    }

    try {
      const fundingSource = await prisma.patientFundingSource.update({
        where: { id: fundingSourceId },
        data: { name: updates.name },
      });
      return { fundingSource: serializePatientFundingSource(fundingSource) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Já existe uma fonte de custeio com este nome.");
      }
      throw error;
    }
  }

  async updateFundingSourceStatus(fundingSourceId: string, isActive: boolean) {
    validatePatientFundingSourceId(fundingSourceId);
    validateIsActive(isActive);

    try {
      const fundingSource = await prisma.patientFundingSource.update({
        where: { id: fundingSourceId },
        data: { isActive },
      });
      return { fundingSource: serializePatientFundingSource(fundingSource) };
    } catch {
      throw new NotFoundError("Fonte de custeio não encontrada.");
    }
  }

  async findActiveFundingSourceOrThrow(fundingSourceId: string) {
    validatePatientFundingSourceId(fundingSourceId);

    const fundingSource = await prisma.patientFundingSource.findUnique({
      where: { id: fundingSourceId },
    });
    if (!fundingSource) {
      throw new NotFoundError("Fonte de custeio não encontrada.");
    }
    if (!fundingSource.isActive) {
      throw new ConflictError("A fonte de custeio selecionada está inativa.");
    }
    return fundingSource;
  }

  private async findFundingSourceOrThrow(fundingSourceId: string) {
    validatePatientFundingSourceId(fundingSourceId);

    const fundingSource = await prisma.patientFundingSource.findUnique({
      where: { id: fundingSourceId },
    });
    if (!fundingSource) {
      throw new NotFoundError("Fonte de custeio não encontrada.");
    }
    return fundingSource;
  }
}

export const patientFundingSourceService = new PatientFundingSourceService();
