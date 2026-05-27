import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CreateFab({ onClick, label, className }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed bottom-6 right-6 z-40 size-14 rounded-full p-0 shadow-lg",
        "bg-ama-blue text-white hover:bg-ama-blue-dark",
        className,
      )}
    >
      <Plus className="size-6" aria-hidden />
    </Button>
  );
}
