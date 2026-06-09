-- Contas pendentes passam a ativo: o Google Workspace já valida o domínio institucional.
UPDATE "User" SET "accountStatus" = 'ativo' WHERE "accountStatus" = 'pendente';
