import {
  BarChart3,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Warehouse,
} from "lucide-react";

export const VENDAS_MODULES = [
  {
    id: "vendas-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    route: "/vendas/dashboard",
    enabled: false,
    adminOnly: false,
    order: 0,
  },
  {
    id: "vendas-lista",
    label: "Vendas",
    icon: Receipt,
    route: "/vendas",
    end: true,
    enabled: true,
    adminOnly: false,
    order: 1,
  },
  {
    id: "vendas-produtos",
    label: "Produtos",
    icon: Package,
    route: "/vendas/produtos",
    enabled: true,
    adminOnly: true,
    order: 2,
  },
  {
    id: "vendas-estoque",
    label: "Estoque",
    icon: Warehouse,
    route: "/vendas/estoque",
    enabled: false,
    adminOnly: true,
    order: 3,
  },
  {
    id: "vendas-fiados",
    label: "Fiados",
    icon: Users,
    route: "/vendas/fiados",
    enabled: true,
    adminOnly: false,
    order: 4,
  },
  {
    id: "vendas-relatorios",
    label: "Relatórios",
    icon: BarChart3,
    route: "/vendas/relatorios",
    enabled: false,
    adminOnly: true,
    order: 5,
  },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "PIX", label: "Pix" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "DEBITO", label: "Débito" },
  { value: "CREDITO", label: "Crédito" },
  { value: "FIADO", label: "Fiado" },
];

export const SALE_STATUS_LABELS = {
  REGISTRADA: "Registrada",
  FIADO_PENDENTE: "Fiado pendente",
  QUITADA: "Quitada",
  CANCELADA: "Cancelada",
};

export function getSaleStatusLabel(status) {
  return SALE_STATUS_LABELS[status] ?? status;
}

export function formatCurrencyFromCents(cents) {
  const value = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseCurrencyToCents(value) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100);
}

export function formatCentsInput(cents) {
  return (Number(cents ?? 0) / 100).toFixed(2).replace(".", ",");
}
