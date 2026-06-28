import { Car, Phone, Wallet } from "lucide-react";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SoftPanel } from "../components/ui/SoftPanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../context/AppDataContext";
import { formatCurrency, formatDate } from "../lib/formatters";

export function ClientesPage() {
  const {
    data: { clients },
  } = useAppData();
  const vehicles = clients.flatMap((client) => client.vehicles);

  return (
    <div className="page-stack">
      <div className="metrics-grid">
        <MetricCard label="Clientes cadastrados" value={String(clients.length)} helper="Cadastro principal com contato e valor historico" />
        <MetricCard label="Veiculos vinculados" value={String(vehicles.length)} helper="Placa, quilometragem e status de revisao" />
        <MetricCard label="Retorno medio" value="18 dias" helper="Janela ideal para campanhas de lembranca" />
        <MetricCard label="Lifetime value" value={formatCurrency(clients.reduce((sum, client) => sum + client.lifetimeValue, 0))} helper="Base para fidelizacao e recorrencia" />
      </div>

      <SoftPanel>
        <SectionHeader
          eyebrow="Modulo 1"
          title="Clientes e seus veiculos"
          description="Tabela operacional para atendimento, historico rapido e status de manutencao."
        />

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Veiculos</th>
                <th>Ultima visita</th>
                <th>Status</th>
                <th>Historico</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <strong>{client.name}</strong>
                    <span>{client.city}</span>
                  </td>
                  <td>
                    <span className="inline-icon">
                      <Phone size={14} />
                      {client.phone}
                    </span>
                    <small>{client.email}</small>
                  </td>
                  <td>
                    <div className="table-chip-list">
                      {client.vehicles.map((vehicle) => (
                        <span key={vehicle.id} className="table-chip">
                          <Car size={14} />
                          {vehicle.model}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{formatDate(client.lastVisit)}</td>
                  <td>
                    <StatusBadge
                      tone={
                        client.vehicles.some((vehicle) => vehicle.status === "Urgente")
                          ? "danger"
                          : client.vehicles.some((vehicle) => vehicle.status === "Revisao em aberto")
                            ? "warning"
                            : "success"
                      }
                      label={client.vehicles.map((vehicle) => vehicle.status).join(" / ")}
                    />
                  </td>
                  <td>
                    <span className="inline-icon">
                      <Wallet size={14} />
                      {formatCurrency(client.lifetimeValue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SoftPanel>

      <div className="content-grid two-columns">
        <SoftPanel>
          <SectionHeader
            eyebrow="Painel de veiculos"
            title="Itens que merecem contato"
            description="Base para automacoes de retorno, preventivas e revisoes periodicas."
          />
          <div className="list-stack">
            {vehicles.map((vehicle) => (
              <article className="stack-card" key={vehicle.id}>
                <div className="stack-card-heading">
                  <div>
                    <strong>{vehicle.brand} {vehicle.model}</strong>
                    <p>{vehicle.plate}</p>
                  </div>
                  <StatusBadge
                    tone={vehicle.status === "Urgente" ? "danger" : vehicle.status === "Revisao em aberto" ? "warning" : "success"}
                    label={vehicle.status}
                  />
                </div>
                <span>{vehicle.mileage.toLocaleString("pt-BR")} km</span>
              </article>
            ))}
          </div>
        </SoftPanel>

        <SoftPanel>
          <SectionHeader
            eyebrow="Espaco para evolucao"
            title="Pontos de extensao do modulo"
            description="A base ja deixa lugar para historico de OS, anexos, tags e comunicacao automatizada."
          />
          <ul className="feature-list">
            <li>Cadastro de cliente com multiplos veiculos e responsavel principal</li>
            <li>Leitura rapida por placa, status de revisao e ultimo atendimento</li>
            <li>Acoplamento facil com lembretes, orcamentos e financeiro</li>
          </ul>
        </SoftPanel>
      </div>
    </div>
  );
}
