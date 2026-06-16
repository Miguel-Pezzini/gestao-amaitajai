import { cn } from "@/lib/utils";

function SkeletonBar({ className, style, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-ama-light/80", className)}
      style={style}
      {...props}
    />
  );
}

function ListSkeletonItem() {
  return (
    <div className="overflow-hidden rounded-xl border border-ama-cyan/20 bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SkeletonBar className="h-5 w-2/3 max-w-xs" />
        <div className="flex gap-2">
          <SkeletonBar className="h-6 w-20 rounded-full" />
          <SkeletonBar className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonBar className="h-4 w-full max-w-md" />
        <SkeletonBar className="h-4 w-4/5 max-w-sm" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <SkeletonBar className="size-8 rounded-md" />
        <SkeletonBar className="size-8 rounded-md" />
        <SkeletonBar className="size-8 rounded-md" />
      </div>
    </div>
  );
}

function ListSkeleton({ count = 4, className }) {
  return (
    <div
      className={cn("space-y-2.5", className)}
      aria-busy="true"
      aria-label="Carregando lista"
    >
      {Array.from({ length: count }, (_, index) => (
        <ListSkeletonItem key={index} />
      ))}
    </div>
  );
}

export { ListSkeleton, ListSkeletonItem, SkeletonBar };
