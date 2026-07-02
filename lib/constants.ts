import { FolderGit2, Upload, type LucideIcon } from "lucide-react";

export interface AppNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    title: "Repositories",
    href: "/repositories",
    icon: FolderGit2,
  },
  {
    title: "Upload",
    href: "/upload",
    icon: Upload,
  },
];
