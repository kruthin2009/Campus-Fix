import { Outlet } from "react-router-dom";
import { PortalLayout, type NavItem } from "../../components/layout/PortalLayout";

const NAV_ITEMS: NavItem[] = [
  { to: "/student", label: "Select Tower", icon: "🏢", end: true },
  { to: "/student/complaints", label: "My Complaints", icon: "📋" },
];

export function StudentPortalLayout() {
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName="Student Portal">
      <Outlet />
    </PortalLayout>
  );
}
