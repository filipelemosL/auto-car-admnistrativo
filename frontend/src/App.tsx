import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  Car,
  ClipboardList,
  DollarSign,
  FileImage,
  FilePlus2,
  Gauge,
  MessageCircle,
  Plus,
  Save,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useAppData } from "./context/AppDataContext";
import { buildBudgetWhatsappPreview } from "./lib/exportTemplates";
import { formatCurrency, formatDate, formatDateTime } from "./lib/formatters";
import type { Budget, Client, FinancialEntry, Reminder, ServiceReport } from "./types/domain";

type WorkspacePanel = "servicos" | "clientes" | "orcamentos" | "financeiro" | "alertas";

const asset = (name: string) => `/assets/${name}`;

export default function App() {
  const { data } = useAppData();
  const [activePanel, setActivePanel] = useState<WorkspacePanel>("orcamentos");
  const latestBudget = data.budgets[0];
  const latestReport = data.serviceReports[0];

  return (
    <main className="autocar-app">
      <section className="workspace-grid">
        <aside className="admin-side" aria-label="Area administrativa">
          <div className="admin-component">
            {activePanel === "orcamentos" ? <BudgetWorkspace budget={latestBudget} clients={data.clients} /> : null}
            {activePanel === "clientes" ? <ClientsWorkspace clients={data.clients} /> : null}
            {activePanel === "servicos" ? <ServiceWorkspace report={latestReport} /> : null}
            {activePanel === "alertas" ? <AlertsWorkspace reminders={data.reminders} /> : null}
            {activePanel === "financeiro" ? <FinanceWorkspace entries={data.financialEntries} /> : null}
          </div>
        </aside>

        <section className="operations-side" aria-label="Painel operacional">
          <div className="top-action-grid">
            <button className="start-service-card" onClick={() => setActivePanel("servicos")}>
              <img src={asset("iniciar-atendimento.png")} alt="" />
            </button>
            <NotificationsCard reminders={data.reminders} onViewAll={() => setActivePanel("alertas")} />
          </div>

          <div className="shortcut-grid" aria-label="Atalhos administrativos">
            <ImageShortcut
              label=""
              image="card-clientes.png"
              active={activePanel === "clientes"}
              onClick={() => setActivePanel("clientes")}
            />
            <ImageShortcut
              label=""
              image="card-orcamento.png"
              active={activePanel === "orcamentos"}
              onClick={() => setActivePanel("orcamentos")}
            />
            <ImageShortcut
              label=""
              image="card-financeiro.png"
              active={activePanel === "financeiro"}
              onClick={() => setActivePanel("financeiro")}
            />
            <ImageShortcut
              label=""
              image="card-alertas.png"
              active={activePanel === "alertas"}
              onClick={() => setActivePanel("alertas")}
            />
          </div>

          <ActiveServicesTable reports={data.serviceReports} />
        </section>
      </section>
    </main>
  );
}

function BudgetWorkspace({ budget, clients }: { budget?: Budget; clients: Client[] }) {
  const selectedClient = clients[0];
  const previewText = budget ? buildBudgetWhatsappPreview(budget) : "";

  return (
    <section className="budget-workspace">
      <div className="component-banner budget-banner">
        <div className="banner-title">
          <ClipboardList size={42} />
          <h2>
            Novo <span>Orçamento</span>
          </h2>
        </div>
        <img src={asset("autocar-clean-logo.png")} alt="AutoCar" />
      </div>

      <div className="form-block">
        <BlockTitle icon={User} title="Cliente" />
        <div className="client-picker">
          <label>
            <span>Selecione o cliente *</span>
            <select value={selectedClient?.id ?? ""} onChange={() => undefined}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.vehicles[0]?.model ?? "sem veiculo"}
                </option>
              ))}
            </select>
          </label>
          <button className="outline-button">
            <Plus size={18} />
            Novo cliente
          </button>
        </div>
      </div>

      <div className="form-block">
        <div className="block-row">
          <BlockTitle icon={ClipboardList} title="Itens do orcamento" />
          <div className="block-actions">
            <button className="outline-button blue">
              <FileImage size={18} />
              Adicionar imagem
            </button>
            <button className="outline-button green">
              <FilePlus2 size={18} />
              Orcamentos prontos
            </button>
          </div>
        </div>

        <div className="budget-item-table">
          <div className="budget-head">
            <span>Descricao do item / servico</span>
            <span>Tipo</span>
            <span>Qtd.</span>
            <span>Valor unit.</span>
            <span>Desconto</span>
            <span>Total</span>
            <span />
          </div>
          <div className="budget-line">
            <textarea defaultValue={budget?.items[0]?.description ?? "Troca de oleo do motor"} />
            <div className="segmented">
              <button className="segment-active">Servico</button>
              <button>Peca</button>
            </div>
            <input defaultValue="1" />
            <input defaultValue={formatCurrency(budget?.items[0]?.unitPrice ?? 0)} />
            <input defaultValue={formatCurrency(0)} />
            <strong>{formatCurrency((budget?.items[0]?.unitPrice ?? 0) + (budget?.laborValue ?? 0))}</strong>
            <button className="danger-icon" title="Remover item" aria-label="Remover item">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <button className="wide-add-button">
          <Plus size={20} />
          Adicionar item
        </button>
      </div>

      <div className="form-block recurring-row">
        <div>
          <BlockTitle icon={CalendarClock} title="Orcamentos recorrentes" />
          <p>Programacao vinculada ao cliente selecionado.</p>
        </div>
        <button className="outline-button">
          <CalendarClock size={18} />
          Adicionar recorrencia
        </button>
      </div>

      <div className="export-preview">
        <span>WhatsApp</span>
        <pre>{previewText}</pre>
      </div>

      <button className="save-button">
        <Save size={20} />
        Salvar orcamento
      </button>
    </section>
  );
}

function ClientsWorkspace({ clients }: { clients: Client[] }) {
  return (
    <section className="admin-panel">
      <PanelTop icon={User} title="Clientes cadastrados" actionLabel="Novo cliente" />
      <div className="client-admin-grid">
        {clients.map((client) => (
          <article className="client-card" key={client.id}>
            <div>
              <strong>{client.name}</strong>
              <span>{client.phone}</span>
            </div>
            <small>{client.city}</small>
            <div className="vehicle-strip">
              {client.vehicles.map((vehicle) => (
                <span key={vehicle.id}>
                  {vehicle.plate} / {vehicle.model}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceWorkspace({ report }: { report?: ServiceReport }) {
  return (
    <section className="admin-panel">
      <PanelTop icon={Wrench} title="Execucao de servico" actionLabel="Anexar imagem" />
      <div className="service-focus">
        <div>
          <span>{report?.title ?? "OS"}</span>
          <h2>{report?.vehicleLabel ?? "Servico sem veiculo"}</h2>
          <p>{report?.clientName ?? "Cliente nao selecionado"}</p>
        </div>
        <StatusPill status={report?.status ?? "Em execucao"} />
      </div>
      <div className="checklist-board">
        {(report?.checklist ?? []).map((item) => (
          <label key={item.id} className={item.done ? "check-row check-row-done" : "check-row"}>
            <input type="checkbox" defaultChecked={item.done} />
            <span>{item.label}</span>
            <small>{item.notes ?? "Sem nota"}</small>
          </label>
        ))}
      </div>
    </section>
  );
}

function AlertsWorkspace({ reminders }: { reminders: Reminder[] }) {
  return (
    <section className="admin-panel">
      <PanelTop icon={Bell} title="Central de alertas" actionLabel="Novo alerta" />
      <div className="alert-admin-list">
        {reminders.map((reminder) => (
          <article key={reminder.id}>
            <div>
              <strong>{reminder.title}</strong>
              <span>{reminder.clientName}</span>
            </div>
            <small>{formatDateTime(reminder.dueAt)}</small>
            <StatusPill status={reminder.status} />
          </article>
        ))}
      </div>
    </section>
  );
}

function FinanceWorkspace({ entries }: { entries: FinancialEntry[] }) {
  const revenue = entries.filter((entry) => entry.type === "Receita").reduce((sum, entry) => sum + entry.amount, 0);
  const costs = entries.filter((entry) => entry.type === "Custo").reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <section className="admin-panel">
      <PanelTop icon={DollarSign} title="Resumo financeiro" actionLabel="Novo recibo" />
      <div className="finance-kpis">
        <KpiCard label="Receita" value={formatCurrency(revenue)} />
        <KpiCard label="Custos" value={formatCurrency(costs)} />
        <KpiCard label="Resultado" value={formatCurrency(revenue - costs)} />
      </div>
      <div className="finance-list">
        {entries.map((entry) => (
          <article key={entry.id}>
            <span>{entry.documentType}</span>
            <strong>{entry.description}</strong>
            <small>{formatDate(entry.issuedAt)}</small>
            <b>{formatCurrency(entry.amount)}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function NotificationsCard({ reminders, onViewAll }: { reminders: Reminder[]; onViewAll: () => void }) {
  return (
    <article className="notifications-card">
      <header>
        <div>
          <Bell size={20} />
          <strong>Notificacoes</strong>
        </div>
        <button onClick={onViewAll}>Ver todas</button>
      </header>
      <div className="notification-list">
        {reminders.map((reminder, index) => (
          <div className="notification-item" key={reminder.id}>
            <span className="notification-icon">
              {index === 0 ? <Gauge size={24} /> : index === 1 ? <BriefcaseBusiness size={24} /> : <CalendarClock size={24} />}
            </span>
            <div>
              <strong>{reminder.title}</strong>
              <small>Cliente: {reminder.clientName}</small>
              <small>Vencimento: {formatDate(reminder.dueAt)}</small>
            </div>
            <button className="whatsapp-button" title="Enviar WhatsApp" aria-label="Enviar WhatsApp">
              <MessageCircle size={22} />
            </button>
          </div>
        ))}
      </div>
      <footer>
        <Bell size={16} />
        {reminders.length} novas notificacoes
      </footer>
    </article>
  );
}

function ImageShortcut({
  active,
  image,
  label,
  onClick,
}: {
  active: boolean;
  image: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "image-shortcut image-shortcut-active" : "image-shortcut"} onClick={onClick}>
      <img src={asset(image)} alt="" />
      <span>{label}</span>
    </button>
  );
}

function ActiveServicesTable({ reports }: { reports: ServiceReport[] }) {
  const rows = reports.flatMap((report, index) => [
    report,
    ...(index === 0
      ? [
          {
            ...report,
            id: `${report.id}-extra-1`,
            vehicleLabel: "Toyota Hilux 2.8",
            clientName: "Maria Oliveira",
            mechanic: "Diagnostico",
            status: "Em execucao" as const,
          },
          {
            ...report,
            id: `${report.id}-extra-2`,
            vehicleLabel: "Jeep Compass 2.0",
            clientName: "Lucas Almeida",
            mechanic: "Pronto para entrega",
            status: "Concluido" as const,
          },
        ]
      : []),
  ]);

  return (
    <section className="active-services">
      <header>
        <div>
          <Wrench size={26} />
          <h2>
            Servicos <span>Ativos</span>
          </h2>
        </div>
      </header>
      <div className="services-table">
        <div className="services-head">
          <span>
            <Car size={18} /> Veiculo
          </span>
          <span>
            <User size={18} /> Dono
          </span>
          <span>
            <Wrench size={18} /> Etapa
          </span>
          <span>Status</span>
        </div>
        <div className="services-body">
          {rows.map((report) => (
            <div className="services-row" key={report.id}>
              <div>
                <LogoChip label={report.vehicleLabel} />
                <span>
                  {report.vehicleLabel}
                  <small>{new Date(report.checkInAt).getFullYear() || 2026}</small>
                </span>
              </div>
              <span>{report.clientName}</span>
              <span className="stage-cell">
                <Wrench size={18} />
                {report.mechanic}
              </span>
              <StatusPill status={report.status} />
            </div>
          ))}
        </div>
      </div>
      <footer className="active-services-footer" aria-hidden="true" />
    </section>
  );
}

function BlockTitle({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="block-title">
      <Icon size={22} />
      <strong>{title}</strong>
    </div>
  );
}

function PanelTop({
  actionLabel,
  icon: Icon,
  title,
}: {
  actionLabel: string;
  icon: typeof User;
  title: string;
}) {
  return (
    <div className="panel-top">
      <BlockTitle icon={Icon} title={title} />
      <button className="outline-button">
        <Plus size={18} />
        {actionLabel}
      </button>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function LogoChip({ label }: { label: string }) {
  const firstWord = label.split(" ")[0] || "Auto";
  return <b className="logo-chip">{firstWord}</b>;
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("peca")
    ? "blue"
    : normalized.includes("concluido") || normalized.includes("entrega")
      ? "purple"
      : normalized.includes("pendente")
        ? "yellow"
        : "green";

  return <span className={`status-pill status-${tone}`}>{status}</span>;
}
