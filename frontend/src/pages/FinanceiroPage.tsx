import { BarChart3, FileText, Landmark } from "lucide-react";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SoftPanel } from "../components/ui/SoftPanel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppData } from "../context/AppDataContext";
import { buildFinancialSummary } from "../lib/exportTemplates";
import { formatCurrency, formatDateTime } from "../lib/formatters";

export function FinanceiroPage() {
  const {
    data: { financialEntries },
  } = useAppData();
  const totalRevenue = financialEntries
    .filter((entry) => entry.type === "Receita")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalCost = financialEntries
    .filter((entry) => entry.type === "Custo")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="page-stack">
      <div className="metrics-grid">
        <MetricCard label="Receitas" value={formatCurrency(totalRevenue)} helper="Entradas por NF, recibos e servicos" />
        <MetricCard label="Custos" value={formatCurrency(totalCost)} helper="Pecas, despesas e operacao" />
        <MetricCard label="Margem preliminar" value={formatCurrency(totalRevenue - totalCost)} helper="Resumo direto para tomada de decisao" />
        <MetricCard label="Horizonte historico" value="Ate 5 anos" helper="Mensal, trimestral e anual com exportacao" />
      </div>

      <div className="content-grid two-columns">
        <SoftPanel>
          <SectionHeader
            eyebrow="Modulo 5"
            title="Notas, recibos e consolidacao financeira"
            description="Base para documentacao fiscal, custos, receitas e acompanhamento executivo."
          />

          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Documento</th>
                  <th>Descricao</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {financialEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.type}</td>
                    <td>{entry.documentType}</td>
                    <td>
                      <strong>{entry.description}</strong>
                      <span>{entry.category}</span>
                    </td>
                    <td>{formatDateTime(entry.issuedAt)}</td>
                    <td>{formatCurrency(entry.amount)}</td>
                    <td>
                      <StatusBadge
                        tone={entry.status === "Pago" || entry.status === "Emitido" ? "success" : "warning"}
                        label={entry.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SoftPanel>

        <div className="page-stack">
          <SoftPanel>
            <SectionHeader
              eyebrow="Resumo estruturado"
              title="Preview da consolidacao"
              description="Resumo reutilizavel para PDF e para exportacao por periodo."
            />
            <div className="preview-shell">
              <div className="preview-heading">
                <BarChart3 size={18} />
                <strong>Resumo mensal</strong>
              </div>
              <pre>{buildFinancialSummary(financialEntries)}</pre>
            </div>
          </SoftPanel>

          <SoftPanel>
            <SectionHeader
              eyebrow="Documentos"
              title="Fila de expedicao"
              description="Espaco reservado para emissao de NF, recibos e demonstrativos."
            />
            <div className="list-stack">
              <article className="stack-card">
                <div className="stack-card-heading">
                  <div className="inline-icon">
                    <FileText size={18} />
                    <strong>Emissao de NF e recibos</strong>
                  </div>
                </div>
                <p>Pronto para conectar com provedor fiscal ou rotina interna.</p>
              </article>

              <article className="stack-card">
                <div className="stack-card-heading">
                  <div className="inline-icon">
                    <Landmark size={18} />
                    <strong>Balanco de custos e receitas</strong>
                  </div>
                </div>
                <p>Consultas preparadas para mensal, trimestral, anual e historico de ate cinco anos.</p>
              </article>
            </div>
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
