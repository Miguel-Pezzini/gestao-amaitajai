import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonBar } from "@/components/ui/list-skeleton";
import { MODALITY_OPTIONS } from "@/features/cadastros/constants";

function SessionModalityCardSkeleton() {
  return (
    <Card className="border-ama-cyan/20">
      <CardHeader className="p-4">
        <SkeletonBar className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBar className="h-4 w-36" />
              <SkeletonBar className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
        <SkeletonBar className="h-9 w-32 rounded-md" />
      </CardContent>
    </Card>
  );
}

function SessionModalitySettingsSkeleton({ count = MODALITY_OPTIONS.length }) {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Carregando tipos de sessão"
    >
      {Array.from({ length: count }, (_, index) => (
        <SessionModalityCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { SessionModalityCardSkeleton, SessionModalitySettingsSkeleton };
