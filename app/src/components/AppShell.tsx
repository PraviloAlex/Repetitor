import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import SidebarNav from "./SidebarNav";
import MobileBottomNav from "./MobileBottomNav";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <>
      <TopBar />
      <SidebarNav />
      <main className="app-shell">{children}</main>
      <MobileBottomNav />
    </>
  );
}
