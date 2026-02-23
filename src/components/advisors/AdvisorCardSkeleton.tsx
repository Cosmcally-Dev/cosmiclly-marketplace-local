import { Skeleton } from '@/components/ui/skeleton';

export const AdvisorCardSkeleton = () => (
  <article className="bg-card rounded-xl border border-border overflow-hidden h-full flex flex-col">
    {/* Avatar header area */}
    <div className="relative bg-gradient-to-b from-secondary/40 to-card pt-5 pb-7 px-5 text-center">
      <div className="mx-auto w-24 h-24 md:w-28 md:h-28">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
    </div>

    {/* Content */}
    <div className="px-5 pb-5 pt-4 text-center flex flex-col flex-1">
      {/* Name */}
      <div className="mb-0.5 min-h-[3.25rem] flex items-center justify-center">
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Title */}
      <div className="mb-3 min-h-[1.25rem] flex justify-center">
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Rating row */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>

      {/* Specialty pills */}
      <div className="flex justify-center gap-1.5 mb-4 h-[2rem] items-center">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Divider */}
      <div className="border-t border-border/50 mb-4" />

      {/* Free minutes badge */}
      <div className="mb-2.5 min-h-[1.75rem] flex justify-center">
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>

      {/* Price */}
      <div className="flex justify-center mb-5">
        <Skeleton className="h-7 w-24" />
      </div>

      {/* Action buttons */}
      <div className="mt-auto space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>
      </div>
    </div>
  </article>
);
