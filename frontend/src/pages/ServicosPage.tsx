import { Camera, ClipboardCheck, FileOutput } from "lucide-react";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SoftPanel } from "../components/ui/SoftPanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../context/AppDataContext";
import { buildServiceReportSummary } from "../lib/exportTemplates";
import { formatDateTime } from "../lib/formatters";

export function ServicosPage() {
  const {
    data: { serviceReports },
  } = useAppData();
  const activeReport = serviceReports[0];

  return (
    <div className="page-stack">
      <div className="metrics-grid">
        <MetricCard label="Ordens abertas" value={String(serviceReports.length)} helper="Painel do patio e da oficina" />
        <MetricCard label="Checklist medio" value="12 passos" helper="Estrutura expansivel por tipo de servico" />
        <MetricCard label="Anexos por OS" value="3.4" helper="Espaco para fotos e evidencias tecnicas" />
        <MetricCard label="Saida do relatorio" value="PDF tecnico" helper="Modelo padronizado por checklist e notas" />
      </div>

      <div className="content-grid two-columns">
        <SoftPanel>
          <SectionHeader
            eyebrow="Modulo 3"
            title="Checklist, notas e imagens"
            description="Fluxo tecnico para execucao do servico e geracao de relatorio para o cliente."
          />

          <div className="list-stack">
            {serviceReports.map((report) => (
              <article key={report.id} className="stack-card">
                <div className="stack-card-heading">
                  <div>
                    <strong>{report.title}</strong>
                    <p>{report.vehicleLabel}</p>
                  </div>
                  <StatusBadge
                    tone={report.status === "Concluido" ? "success" : report.status === "Aguardando peca" ? "warning" : "info"}
                    label={report.status}
                  />
                </div>

                <small>{report.clientName} • {report.mechanic} • {formatDateTime(report.checkInAt)}</small>

                <div className="checklist-grid">
                  {report.checklist.map((item) => (
                    <label key={item.id} className={`checklist-item ${item.done ? "checklist-item-done" : ""}`}>
                      <ClipboardCheck size={16} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SoftPanel>

        <div className="page-stack">
          <SoftPanel>
            <SectionHeader
              eyebrow="Relatorio"
              title="Modelo de saida estruturada"
              description="Resumo pronto para virar PDF tecnico com notas e anexos."
            />
            <div className="preview-shell">
              <div className="preview-heading">
                <FileOutput size={18} />
                <strong>Texto-base do relatorio</strong>
              </div>
              <pre>{activeReport ? buildServiceReportSummary(activeReport) : "Nenhum relatorio de servico disponivel no mock."}</pre>
            </div>
          </SoftPanel>

          <SoftPanel>
            <SectionHeader
              eyebrow="Midia"
              title="Anexos da OS"
              description="Preparado para receber imagens do Supabase Storage."
            />
            <div className="image-grid">
              {(activeReport?.images ?? []).map((image) => (
                <div key={image} className="image-card">
                  <div
                    className="image-fill"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(15, 23, 42, 0.38)), url(${image})` }}
                  />
                  <span className="inline-icon">
                    <Camera size={14} />
                    Evidencia tecnica
                  </span>
                </div>
              ))}
            </div>
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
