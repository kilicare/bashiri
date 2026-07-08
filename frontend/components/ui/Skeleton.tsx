import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-white/5",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:animate-[shimmer_1.5s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        className
      )} 
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-3xl p-5 bg-[#1A1A24] border border-white/5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={clsx("h-4 rounded-lg", i === lines - 1 ? "w-2/3" : "w-full")} 
        />
      ))}
    </div>
  );
}

export function AvatarSkeleton() {
  return (
    <div className="relative">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full" />
    </div>
  );
}