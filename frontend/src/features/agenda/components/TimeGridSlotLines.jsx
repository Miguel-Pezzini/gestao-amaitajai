import { buildTimeGridSlotLines } from "@/features/room-occupancy/utils";
import { cn } from "@/lib/utils";

const LINE_VARIANT_CLASS = {
  hour: "border-t-ama-cyan/20",
  half: "border-t-ama-cyan/15",
  quarter: "border-t-ama-cyan/8",
};

export function TimeGridSlotLines() {
  const lines = buildTimeGridSlotLines();

  return (
    <>
      {lines.map((line, index) => (
        <div
          key={index}
          className={cn(
            "pointer-events-none absolute inset-x-0 border-t",
            LINE_VARIANT_CLASS[line.variant],
          )}
          style={{ top: `${line.topPercent}%` }}
        />
      ))}
    </>
  );
}
