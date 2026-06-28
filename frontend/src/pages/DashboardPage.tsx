import { ArrowUpRight, CalendarDays, DollarSign, Wrench } from "lucide-react";
import { moduleLinks } from "../config/modules";
import { useAppData } from "../context/AppDataContext";
import { formatCompact, formatCurrency, formatDateTime } from "../lib/formatters";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SoftPanel } from "../components/ui/SoftPanel";
import { StatusBadge } from "../components/ui/StatusBadge";

export function DashboardPage() {
  const {
    data: { budgets, clients, financialEntries, reminders, serviceReports },
  } = useAppData();
  const totalRevenue = financialEntries
    .filter((entry) => entry.type === "Receita")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="page-stack">
      <SoftPanel className="hero-panel">
        <div>
          <span className="section-eyebrow">Base administrativa</span>
          <h2>Controle completo da oficina com foco operacional e exportacao estruturada.</h2>
          <p>
            O layout ja nasce separado por modulos, pronto para Supabase, com areas para
            relatorios, automacao de contato e indicadores financeiros.
          </p>
        </div>

        <div className="hero-actions">
          <button className="primary-button">Novo orcamento</button>
          <button className="secondary-button">Abrir checklist de servico</button>
        </div>
      </SoftPanel>

      <div className="metrics-grid">
        <MetricCard label="Clientes ativos" value={formatCompact(clients.length)} helper="Base centralizada por historico e veiculos" />
        <MetricCard label="Orcamentos em andamento" value={formatCompact(budgets.length)} helper="Com exportacao para WhatsApp e PDF" />
        <MetricCard label="Servicos abertos" value={formatCompact(serviceReports.length)} helper="Checklist, notas e evidencias visuais" />
        <MetricCard label="Receita do periodo" value={formatCurrency(totalRevenue)} helper="Pronto para consolidacao mensal e anual" />
      </div>

      <div className="content-grid two-columns">
        <SoftPanel>
          <SectionHeader
            eyebrow="Modulos principais"
            title="Estrutura inicial do produto"
            description="Os cinco modulos ja estao desenhados com fluxo administrativo e espaco para integracoes."
          />
          <div className="module-grid">
            {moduleLinks.slice(1).map((module) => {
              const Icon = module.icon;
              return (
                <article key={module.path} className="module-card">
                  <Icon size={20} />
                  <strong>{module.title}</strong>
                  <p>{module.description}</p>
                  <span>
                    Abrir modulo <ArrowUpRight size={14} />
                  </span>
                </article>
              );
            })}
          </div>
        </SoftPanel>

        <SoftPanel>
          <SectionHeader
            eyebrow="Agenda"
            title="Proximos lembretes e operacoes sensiveis"
            description="Visao rapida para retorno de clientes, cobranca de aprovacoes e acompanhamento."
          />
          <div className="timeline-list">
            {reminders.map((reminder) => (
              <article key={reminder.id} className="timeline-item">
                <div className="timeline-icon">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <strong>{reminder.title}</strong>
                  <p>{reminder.clientName}</p>
                </div>
                <div className="timeline-meta">
                  <StatusBadge tone={reminder.status === "Pendente" ? "warning" : "info"} label={reminder.channel} />
                  <small>{formatDateTime(reminder.dueAt)}</small>
                </div>
              </article>
            ))}
          </div>
        </SoftPanel>
      </div>

      <div className="content-grid two-columns">
        <SoftPanel>
          <SectionHeader
            eyebrow="Operacao da oficina"
            title="Servicos em foco"
            description="Acompanhamento das ordens em execucao e pendencias de peca."
          />
          <div className="list-stack">
            {serviceReports.map((report) => (
              <article key={report.id} className="stack-card">
                <div className="stack-card-heading">
                  <div>
                    <strong>{report.title}</strong>
                    <p>{report.clientName}</p>
                  </div>
                  <StatusBadge
                    tone={report.status === "Aguardando peca" ? "warning" : "success"}
                    label={report.status}
                  />
                </div>
                <div className="inline-list">
                  <span>
                    <Wrench size={14} />
                    {report.mechanic}
                  </span>
                  <span>{report.vehicleLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </SoftPanel>

        <SoftPanel>
          <SectionHeader
            eyebrow="Financeiro"
            title="Pulso da operacao"
            description="Receitas, custos e documentos em uma leitura executiva compacta."
          />
          <div className="finance-highlight">
            <div>
              <DollarSign size={22} />
              <strong>{formatCurrency(totalRevenue)}</strong>
              <span>Receita consolidada do periodo</span>
            </div>
            <p>
              Estrutura preparada para NF, recibos, resumo mensal, trimestral, anual e historico
              de ate 5 anos com exportacao em PDF.
            </p>
          </div>
        </SoftPanel>
      </div>
    </div>
  );
}
