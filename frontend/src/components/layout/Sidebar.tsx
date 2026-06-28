import { NavLink } from "react-router-dom";
import { moduleLinks } from "../../config/modules";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand-card">
          <div className="brand-orb" />
          <div>
            <span className="brand-kicker">AutoCar Admin</span>
            <strong>Painel da oficina</strong>
          </div>
        </div>

        <nav className="nav-list">
          {moduleLinks.map((module) => {
            const Icon = module.icon;

            return (
              <NavLink
                key={module.path}
                to={module.path}
                end={module.path === "/"}
                className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <div>
                  <strong>{module.title}</strong>
                  <span>{module.description}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>Base pronta para Supabase</span>
          <strong>Temas por variaveis CSS</strong>
        </div>
      </aside>

      {open ? <button className="sidebar-overlay" onClick={onClose} aria-label="Fechar menu" /> : null}
    </>
  );
}
