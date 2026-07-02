import { AppContentSkeleton } from "@/components/layout/app-content-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-4 md:flex md:flex-col">
        <div className="flex items-center gap-3 pb-6">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        <Skeleton className="mb-3 h-3 w-16" />

        <div className="space-y-2">
          <SidebarMenuSkeleton showIcon />
          <SidebarMenuSkeleton showIcon />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border/60 px-4">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-7 rounded-full" />
        </header>

        <AppContentSkeleton />
      </div>
    </div>
  );
}
