import { useParams } from "@tanstack/react-router";
import { PrivacyToggle } from "@features/user/components/privacy-toggle";
import { UserAvatarMenu } from "@features/user/components/user-avatar-menu";
import { useGetWorkspaces, useGetProfile } from "@finza/api-client/hooks";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Sidebar } from "./sidebar";
import { Skeleton } from "@ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@ui/button";
import { useState } from "react";
import type { Workspace } from "@features/workspaces/types";

export function MobileHeader() {
  const { workspaceId } = useParams({ from: "/_authenticated/$workspaceId" });
  const { data: workspaces, isLoading: isWorkspacesLoading } =
    useGetWorkspaces<Workspace[]>();
  const { data: user } = useGetProfile();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 md:hidden">
      {/* Top bar: Menu + Logo + Workspace Switcher + Avatar */}
      <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <Sidebar className="flex! h-full w-full border-r-0" onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          {isWorkspacesLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 animate-pulse rounded-full bg-muted" />
              <Skeleton className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <WorkspaceSwitcher
              workspaces={workspaces ?? []}
              currentWorkspaceId={workspaceId}
              className="max-w-48"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <PrivacyToggle />
          {user && <UserAvatarMenu user={user} />}
        </div>
      </header>
    </div>
  );
}
