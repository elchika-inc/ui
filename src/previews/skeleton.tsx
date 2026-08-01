import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonPreview() {
  return (
    <section
      className="flex max-w-sm items-center gap-4 p-6"
      aria-busy="true"
      aria-label="読み込み中"
    >
      <Skeleton className="size-12 rounded-full" aria-hidden="true" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" aria-hidden="true" />
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-1/2" aria-hidden="true" />
      </div>
    </section>
  );
}
