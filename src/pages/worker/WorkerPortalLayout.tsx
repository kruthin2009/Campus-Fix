import { Outlet } from "react-router-dom";
import { PortalLayout, type NavItem } from "../../components/layout/PortalLayout";

const NAV_ITEMS: NavItem[] = [
  { to: "/worker", label: "My Work", icon: "🛠️", end: true },
];

export function WorkerPortalLayout() {
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName="Worker Portal">
      <Outlet />
    </PortalLayout>
  );
}
