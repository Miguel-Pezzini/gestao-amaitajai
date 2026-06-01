export function SelectedItems({ items, onRemove }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded-md border border-ama-cyan/40 bg-ama-light px-2 py-1 text-xs text-ama-blue-dark hover:bg-ama-cyan/20"
          title="Remover"
        >
          {item.label} ×
        </button>
      ))}
    </div>
  );
}
