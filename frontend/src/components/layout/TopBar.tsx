import { Bell, Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { moduleLinks } from "../../config/modules";
import { DataModeBadge } from "./DataModeBadge";

interface TopBarProps {
  onOpenNavigation: () => void;
}

export function TopBar({ onOpenNavigation }: TopBarProps) {
  const location = useLocation();
  const activeModule =
    moduleLinks.find((module) => module.path === location.pathname) ?? moduleLinks[0];

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <button className="icon-button nav-toggle" onClick={onOpenNavigation} aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <div>
          <span className="section-eyebrow">Oficina mecanica</span>
          <h1>{activeModule.title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <DataModeBadge />
        <label className="search-field">
          <Search size={16} />
          <input placeholder="Buscar cliente, placa ou OS" />
        </label>
        <button className="icon-button" aria-label="Notificacoes">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
