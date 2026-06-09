import { cn } from "@/lib/utils";

export function Tooltip({ content, children, className }) {
  if (!content) {
    return children;
  }

  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-1/2 right-[calc(100%+6px)] z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-ama-blue-dark px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
