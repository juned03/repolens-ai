"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Avatar size="sm" className="ml-1">
          <AvatarFallback aria-label="User account">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
