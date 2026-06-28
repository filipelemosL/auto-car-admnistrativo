import { DatabaseZap } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";

export function DataModeBadge() {
  const { dataMode, error, loading } = useAppData();

  const label = loading
    ? "Carregando dados"
    : dataMode === "mock"
      ? "Modo mock local"
      : "API conectada";

  return (
    <div className={`mode-badge ${dataMode === "mock" ? "mode-badge-mock" : "mode-badge-api"}`}>
      <span className="inline-icon">
        <DatabaseZap size={14} />
        {label}
      </span>
      {error ? <small>{error}</small> : null}
    </div>
  );
}
