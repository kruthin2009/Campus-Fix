import { Outlet } from "react-router-dom";
import { PortalLayout, type NavItem } from "../../components/layout/PortalLayout";

const NAV_ITEMS: NavItem[] = [
  { to: "/worker", label: "My Work", icon: "🛠️", end: true },
  { to: "/worker/announcements", label: "Announcements & Maintenance", icon: "📢" },
  { to: "/worker/ai-news", label: "Latest AI News", icon: "🤖" },
];

export function WorkerPortalLayout() {
  return <PortalLayout navItems={NAV_ITEMS} portalName="Worker Portal"><Outlet /></PortalLayout>;
}
