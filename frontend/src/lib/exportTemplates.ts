import type { Budget, FinancialEntry, ServiceReport } from "../types/domain";
import { formatCurrency, formatDate, formatDateTime } from "./formatters";

export function buildBudgetWhatsappPreview(budget: Budget) {
  const items = budget.items
    .map(
      (item) =>
        `- ${item.description}: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`,
    )
    .join("\n");

  const total =
    budget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) +
    budget.laborValue;

  return [
    `*Orcamento AutoCar*`,
    `Cliente: ${budget.clientName}`,
    `Veiculo: ${budget.vehicleLabel}`,
    `Data: ${formatDate(budget.createdAt)}`,
    "",
    "*Itens*",
    items,
    "",
    `Mao de obra: ${formatCurrency(budget.laborValue)}`,
    `Total estimado: ${formatCurrency(total)}`,
    "",
    `Observacoes: ${budget.notes}`,
  ].join("\n");
}

export function buildServiceReportSummary(report: ServiceReport) {
  return [
    `Relatorio de Servico`,
    `OS: ${report.title}`,
    `Cliente: ${report.clientName}`,
    `Veiculo: ${report.vehicleLabel}`,
    `Entrada: ${formatDateTime(report.checkInAt)}`,
    `Mecanico: ${report.mechanic}`,
    "",
    "Checklist:",
    ...report.checklist.map((item) => `- [${item.done ? "x" : " "}] ${item.label}`),
    "",
    "Notas:",
    ...report.notes.map((note) => `- ${note}`),
    "",
    `Imagens anexadas: ${report.images.length}`,
  ].join("\n");
}

export function buildFinancialSummary(entries: FinancialEntry[]) {
  const totalRevenue = entries
    .filter((entry) => entry.type === "Receita")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalCost = entries
    .filter((entry) => entry.type === "Custo")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return [
    "Resumo Financeiro",
    `Periodo: ${entries[0]?.referenceMonth ?? "--"}`,
    `Receitas: ${formatCurrency(totalRevenue)}`,
    `Custos: ${formatCurrency(totalCost)}`,
    `Resultado: ${formatCurrency(totalRevenue - totalCost)}`,
  ].join("\n");
}
