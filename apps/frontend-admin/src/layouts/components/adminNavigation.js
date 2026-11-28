import { LayoutDashboard, Users, Palette, Layers, CreditCard, LineChart, Bell, Activity, Radio } from "lucide-react";
import { ADMIN_ROUTE_PATHS as paths } from "../../app/routes";

export function adminNavigationGroups(lang) {
  const en = lang === "en";
  return [
    { id: "workspace", label: en ? "Workspace" : "កន្លែងធ្វើការ", items: [
      { to: paths.dashboard, icon: LayoutDashboard, label: en ? "Overview dashboard" : "ផ្ទាំងគ្រប់គ្រងទូទៅ", exact: true },
      { to: paths.users, icon: Users, label: en ? "Users" : "អ្នកប្រើប្រាស់" },
      { to: paths.templates, icon: Palette, label: en ? "Invitation templates" : "គំរូសំបុត្រអញ្ជើញ" },
      { to: paths.packages, icon: Layers, label: en ? "Service packages" : "កញ្ចប់សេវាកម្ម" },
    ] },
    { id: "finance", label: en ? "Finance" : "ហិរញ្ញវត្ថុ", items: [
      { to: paths.payments, icon: CreditCard, label: en ? "KHQR payments" : "ការទូទាត់ KHQR" },
      { to: paths.reports, icon: LineChart, label: en ? "Financial reports" : "របាយការណ៍ហិរញ្ញវត្ថុ" },
    ] },
    { id: "system", label: en ? "System" : "ប្រព័ន្ធ", items: [
      { to: paths.notifications, icon: Bell, label: en ? "Notifications" : "ការជូនដំណឹង" },
      { to: paths.systemLogs, icon: Activity, label: en ? "System logs" : "កំណត់ហេតុប្រព័ន្ធ" },
      ...(import.meta.env.DEV ? [{ to: paths.apiMonitor, icon: Radio, label: en ? "API monitor" : "ត្រួតពិនិត្យ API" }] : []),
    ] },
  ];
}

export function adminNavigation(lang) {
  return adminNavigationGroups(lang).flatMap(group => group.items);
}

export function filterAdminNavigation(items, query) {
  const normalized = query.trim().toLocaleLowerCase();
  return items.filter(item => `${item.label} ${item.to}`.toLocaleLowerCase().includes(normalized));
}
