import { CalendarDays, Clock3, Repeat } from "lucide-react";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SoftPanel } from "../components/ui/SoftPanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../context/AppDataContext";
import { formatDateTime } from "../lib/formatters";

export function LembretesPage() {
  const {
    data: { reminders },
  } = useAppData();

  return (
    <div className="page-stack">
      <div className="metrics-grid">
        <MetricCard label="Lembretes ativos" value={String(reminders.length)} helper="Configurados por cliente, canal e data" />
        <MetricCard label="Recorrencias" value="Mensal / Trimestral" helper="Base para revisoes, cobrancas e retornos" />
        <MetricCard label="Canal principal" value="WhatsApp" helper="Tambem pronto para ligacao e email" />
        <MetricCard label="Automacao futura" value="Fila agendada" helper="Preparado para workers e notificacoes" />
      </div>

      <SoftPanel>
        <SectionHeader
          eyebrow="Modulo 4"
          title="Agenda inteligente por cliente"
          description="Criacao de lembretes unicos ou recorrentes com data, hora e finalidade comercial."
        />

        <div className="timeline-list">
          {reminders.map((reminder) => (
            <article key={reminder.id} className="timeline-item reminder-item">
              <div className="timeline-icon">
                <CalendarDays size={18} />
              </div>
              <div>
                <strong>{reminder.title}</strong>
                <p>{reminder.clientName}</p>
              </div>
              <div className="reminder-details">
                <span className="inline-icon">
                  <Clock3 size={14} />
                  {formatDateTime(reminder.dueAt)}
                </span>
                <span className="inline-icon">
                  <Repeat size={14} />
                  {reminder.recurrence}
                </span>
              </div>
              <StatusBadge
                tone={reminder.status === "Concluido" ? "success" : reminder.status === "Pendente" ? "warning" : "info"}
                label={reminder.status}
              />
            </article>
          ))}
        </div>
      </SoftPanel>

      <SoftPanel>
        <SectionHeader
          eyebrow="Regras de negocio"
          title="Extensoes previstas para o modulo"
          description="A base separa o lembrete em entidade propria para facilitar fila, agenda e automacoes."
        />
        <ul className="feature-list">
          <li>Recorrencia unificada em valores simples para sincronizar front, API e banco</li>
          <li>Relacionamento direto com clientes para campanhas preventivas e cobrancas</li>
          <li>Espaco para prioridades, templates de mensagem e historico de disparos</li>
        </ul>
      </SoftPanel>
    </div>
  );
}
