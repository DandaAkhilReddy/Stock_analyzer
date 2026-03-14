import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-shimmer rounded-lg ${className}`} />
  );
}

export function AnalysisSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 py-6"
    >
      {/* Stock Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-8 w-28 ml-auto" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </div>

      {/* Metrics Bar Skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-32 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Signal Banner Skeleton */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* Tab Bar Skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>

      {/* Content Area Skeleton */}
      <Skeleton className="h-80 w-full rounded-2xl" />
    </motion.div>
  );
}
