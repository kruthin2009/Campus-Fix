import { Outlet } from "react-router-dom";
import { PortalLayout, type NavItem } from "../../components/layout/PortalLayout";

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/towers", label: "Towers", icon: "🏢" },
  { to: "/admin/departments", label: "Departments", icon: "🗂️" },
  { to: "/admin/workers", label: "Workers", icon: "🛠️" },
  { to: "/admin/teams", label: "Teams", icon: "👥" },
  { to: "/admin/complaints", label: "Complaints", icon: "📋" },
  { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { to: "/admin/users", label: "Users", icon: "👤" },
  { to: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminPortalLayout() {
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName="Admin Portal">
      <Outlet />
    </PortalLayout>
  );
}
