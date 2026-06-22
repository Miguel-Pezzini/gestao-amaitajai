export const STOCK_LEVEL = {
  LOW: "low",
  MEDIUM: "medium",
  GOOD: "good",
};

export function getProductStockLevel(stockQty, minStockQty) {
  const stock = Number(stockQty ?? 0);
  const minimum = Number(minStockQty ?? 0);

  if (stock < minimum) {
    return STOCK_LEVEL.LOW;
  }
  if (stock === minimum) {
    return STOCK_LEVEL.MEDIUM;
  }
  return STOCK_LEVEL.GOOD;
}

export const STOCK_LEVEL_STYLES = {
  [STOCK_LEVEL.LOW]: "font-semibold text-red-600",
  [STOCK_LEVEL.MEDIUM]: "font-semibold text-amber-600",
  [STOCK_LEVEL.GOOD]: "font-semibold text-emerald-600",
};

export const STOCK_LEGEND_ITEMS = [
  { level: STOCK_LEVEL.LOW, label: "Estoque baixo", dotClass: "bg-red-500" },
  { level: STOCK_LEVEL.MEDIUM, label: "Estoque médio", dotClass: "bg-amber-500" },
  { level: STOCK_LEVEL.GOOD, label: "Estoque bom", dotClass: "bg-emerald-500" },
];
