import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { cloneMockAppSnapshot, emptyAppSnapshot } from "../data/mockData";
import { dataClient, type DataMode } from "../lib/dataClient";
import type { AppDataSnapshot } from "../types/appData";

interface AppDataContextValue {
  data: AppDataSnapshot;
  dataMode: DataMode;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppDataSnapshot>(
    dataClient.mode === "mock" ? cloneMockAppSnapshot() : emptyAppSnapshot,
  );
  const [dataMode, setDataMode] = useState<DataMode>(dataClient.mode);
  const [loading, setLoading] = useState<boolean>(dataClient.mode === "api");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await dataClient.getAppSnapshot();
      setData(snapshot);
      setDataMode(dataClient.mode);
    } catch (loadError) {
      setData(cloneMockAppSnapshot());
      setDataMode("mock");
      setError("API indisponivel no momento. Exibindo mock local para manter o front funcionando.");
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (dataClient.mode === "api") {
      void load();
    }
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        data,
        dataMode,
        error,
        loading,
        reload: load,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData precisa ser usado dentro de AppDataProvider.");
  }

  return context;
}
