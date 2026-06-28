import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: PropsWithChildren) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("body-locked", navigationOpen);

    return () => {
      document.body.classList.remove("body-locked");
    };
  }, [navigationOpen]);

  return (
    <div className="app-frame">
      <Sidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />

      <main className="app-content">
        <TopBar onOpenNavigation={() => setNavigationOpen(true)} />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
