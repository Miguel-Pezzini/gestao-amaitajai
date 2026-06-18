import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { EntityListIconAction } from "@/components/cadastros/EntityListItem";
import { Badge } from "@/components/ui/badge";

function CategoryStatusBadge({ active }) {
  if (active) {
    return (
      <Badge className="rounded-full border-transparent bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-emerald-600">
        Ativa
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full border-muted-foreground/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
    >
      Inativa
    </Badge>
  );
}

export function CategoriesTable({ categories, onEdit, onToggleStatus }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ama-cyan/20">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ama-cyan/20 bg-ama-light/40 text-center text-xs font-semibold tracking-wide text-ama-blue-dark uppercase">
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category._id}
                  className="border-b border-ama-cyan/10 last:border-b-0 hover:bg-ama-light/20"
                >
                  <td className="px-4 py-3 text-center font-medium text-ama-text">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CategoryStatusBadge active={category.isActive} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <EntityListIconAction
                        label="Editar"
                        icon={Pencil}
                        onClick={() => onEdit(category)}
                      />
                      <EntityListIconAction
                        label={category.isActive ? "Inativar" : "Reativar"}
                        icon={category.isActive ? Trash2 : RotateCcw}
                        tone={category.isActive ? "destructive" : "default"}
                        onClick={() => onToggleStatus(category)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
