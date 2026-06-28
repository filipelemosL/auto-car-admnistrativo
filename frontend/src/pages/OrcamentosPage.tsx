import { FileText, MessageCircle } from "lucide-react";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SoftPanel } from "../components/ui/SoftPanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../context/AppDataContext";
import { buildBudgetWhatsappPreview } from "../lib/exportTemplates";
import { formatCurrency, formatDate } from "../lib/formatters";

export function OrcamentosPage() {
  const {
    data: { budgets },
  } = useAppData();
  const totalPipeline = budgets.reduce(
    (sum, budget) =>
      sum + budget.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0) + budget.laborValue,
    0,
  );
  const previewBudget = budgets[0];

  return (
    <div className="page-stack">
      <div className="metrics-grid">
        <MetricCard label="Pipeline aberto" value={formatCurrency(totalPipeline)} helper="Somatorio de pecas e mao de obra" />
        <MetricCard label="Aprovacao media" value="71%" helper="Espaco reservado para KPI real por periodo" />
        <MetricCard label="Tempo de resposta" value="1h 28m" helper="Do rascunho ao envio para o cliente" />
        <MetricCard label="Exportacoes" value="WhatsApp + PDF" helper="Saidas estruturadas para venda e arquivo" />
      </div>

      <div className="content-grid two-columns">
        <SoftPanel>
          <SectionHeader
            eyebrow="Modulo 2"
            title="Estruturacao de orcamentos"
            description="Itens, mao de obra, observacoes e estados de aprovacao em um fluxo padrao."
          />

          <div className="list-stack">
            {budgets.map((budget) => {
              const total =
                budget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + budget.laborValue;

              return (
                <article key={budget.id} className="stack-card">
                  <div className="stack-card-heading">
                    <div>
                      <strong>{budget.clientName}</strong>
                      <p>{budget.vehicleLabel}</p>
                    </div>
                    <StatusBadge
                      tone={budget.status === "Aprovado" ? "success" : budget.status === "Recusado" ? "danger" : "info"}
                      label={budget.status}
                    />
                  </div>

                  <div className="budget-row">
                    <span>{formatDate(budget.createdAt)}</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>

                  <ul className="mini-list">
                    {budget.items.map((item) => (
                      <li key={item.id}>
                        {item.description} - {item.quantity} x {formatCurrency(item.unitPrice)}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </SoftPanel>

        <div className="page-stack">
          <SoftPanel>
            <SectionHeader
              eyebrow="Exportacao para conversa"
              title="Preview para WhatsApp"
              description="Mensagem pronta para ser enviada com valores e observacoes."
            />
            <div className="preview-shell">
              <div className="preview-heading">
                <MessageCircle size={18} />
                <strong>Template de envio</strong>
              </div>
              <pre>{previewBudget ? buildBudgetWhatsappPreview(previewBudget) : "Nenhum orcamento disponivel no mock."}</pre>
            </div>
          </SoftPanel>

          <SoftPanel>
            <SectionHeader
              eyebrow="Exportacao formal"
              title="Modelo para PDF"
              description="Cabecalho, itens, totais e rodape prontos para renderizacao estruturada."
            />
            <div className="inline-icon feature-callout">
              <FileText size={18} />
              O backend ja nasce com endpoint para exportar PDF de orcamento usando o mesmo payload.
            </div>
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
