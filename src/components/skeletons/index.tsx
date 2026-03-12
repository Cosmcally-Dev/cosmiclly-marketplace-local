import { Skeleton } from "@/components/ui/skeleton";

export { AdvisorCardSkeleton } from "@/components/advisors/AdvisorCardSkeleton";

/** Skeleton for the Profile page header section */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-56" />
      <div className="flex gap-3 mt-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}

/** Skeleton for the Chat/Call/Video session connecting state */
export function SessionPageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-3 mt-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton for a single row in the Activity list */
export function ActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** Skeleton for a single row in the Transactions list */
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/** Skeleton for a stat card in the Admin dashboard */
export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
