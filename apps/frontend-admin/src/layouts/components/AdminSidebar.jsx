import { useId, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useAdminLanguage } from "../../app/providers/AdminLanguageProvider";
import AdminDialog from "./AdminDialog";
import { adminNavigationGroups, filterAdminNavigation } from "./adminNavigation";
import BrandLogo from "../../shared/branding/BrandLogo";

function NavigationGroups({ groups, onNavigate }) {
  const idPrefix = useId();
  return groups.map(({ id, label, items }) => items.length > 0 && (
    <div className="admin-nav-group" key={id} role="group" aria-labelledby={`${idPrefix}-${id}`}>
      <p id={`${idPrefix}-${id}`} className="admin-nav-label">{label}</p>
      <ul>
        {items.map(({ to, icon: Icon, label: name, exact }) => (
          <li key={to}>
            <NavLink to={to} end={exact} onClick={onNavigate}>
              <Icon size={19} aria-hidden="true" />
              <span>{name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  ));
}

function MobileNavigation({ groups, en, onNavigate }) {
  const [query, setQuery] = useState("");
  const matches = groups.map(group => ({ ...group, items: filterAdminNavigation(group.items, query) }));
  return (
    <AdminDialog id="admin-mobile-navigation" label={en ? "Admin navigation" : "ម៉ឺនុយរដ្ឋបាល"} className="admin-navigation-dialog" onClose={onNavigate}>
      <div className="admin-navigation-panel">
        <div className="admin-dialog-heading">
          <div className="admin-drawer-brand"><BrandLogo variant="compact" priority /></div>
          <button type="button" className="admin-icon-button" onClick={onNavigate} aria-label={en ? "Close navigation" : "បិទម៉ឺនុយ"}>
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <label className="admin-search-label" htmlFor="admin-mobile-page-search">{en ? "Find a page" : "ស្វែងរកទំព័រ"}</label>
        <div className="admin-search-field">
          <Search size={18} aria-hidden="true" />
          <input id="admin-mobile-page-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={en ? "Page name" : "ឈ្មោះទំព័រ"} />
        </div>
        <nav className="admin-mobile-links" aria-label={en ? "Workspace pages" : "ទំព័រកន្លែងធ្វើការ"}>
          <NavigationGroups groups={matches} onNavigate={onNavigate} />
          {!matches.some(group => group.items.length) && <p className="admin-search-empty" role="status">{en ? "No pages found. Try a different page name." : "រកមិនឃើញទំព័រ។ សូមសាកឈ្មោះទំព័រផ្សេងទៀត។"}</p>}
        </nav>
      </div>
    </AdminDialog>
  );
}

export default function AdminSidebar({ isMobileOpen, onNavigate }) {
  const { lang } = useAdminLanguage();
  const en = lang === "en";
  const groups = adminNavigationGroups(lang);
  return <>
    <aside className="admin-rail">
      <nav aria-label={en ? "Admin navigation" : "ម៉ឺនុយរដ្ឋបាល"}>
        <NavigationGroups groups={groups} />
      </nav>
    </aside>
    {isMobileOpen && <MobileNavigation groups={groups} en={en} onNavigate={onNavigate} />}
  </>;
}
