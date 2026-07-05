import { apiConfig } from "./api";
import { trackDbOperation } from "./dbLoading";
import { cloneMockAppSnapshot } from "../data/mockData";
import type { AppDataSnapshot } from "../types/appData";
import type {
  Budget,
  BudgetItem,
  Client,
  CompanySettings,
  DiagnosisRecord,
  FixedCost,
  FinancialEntry,
  PaymentRecord,
  Reminder,
  ServiceChecklistItem,
  ServiceOrder,
  ServiceTask,
  ServiceReport,
  Vehicle,
} from "../types/domain";

export type DataMode = "mock" | "api";

interface ApiVehicle {
  id: string;
  client_id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color?: string | null;
  mileage: number;
  status: Vehicle["status"];
}

interface ApiClient {
  id: string;
  name: string;
  phone: string;
  cpf_cnpj?: string | null;
  email: string;
  city: string;
  lifetime_value: number;
  last_visit: string | null;
  vehicles?: ApiVehicle[];
}

interface ApiBudgetItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface ApiBudget {
  id: string;
  client_name: string;
  vehicle_label: string;
  status: Budget["status"];
  labor_value: number;
  created_at: string | null;
  items: ApiBudgetItem[];
  notes: string;
}

interface ApiChecklistItem {
  id?: string;
  label: string;
  done: boolean;
  notes?: string | null;
}

interface ApiServiceReport {
  id: string;
  title: string;
  client_name: string;
  vehicle_label: string;
  check_in_at: string | null;
  status: ServiceReport["status"];
  mechanic: string;
  notes: string[];
  images: string[];
  checklist: ApiChecklistItem[];
}

interface ApiReminder {
  id: string;
  title: string;
  client_name: string;
  channel: Reminder["channel"];
  due_at: string;
  recurrence: Reminder["recurrence"];
  status: Reminder["status"];
}

interface ApiFinancialEntry {
  id: string;
  type: FinancialEntry["type"];
  category: string;
  document_type: FinancialEntry["documentType"];
  description: string;
  amount: number;
  issued_at: string;
  reference_month: string;
  status: FinancialEntry["status"];
}

interface ApiDiagnosisRecord {
  customer_complaint: string;
  mechanic_diagnosis: string;
  diagnostic_tool: string;
  dtc_codes: string;
  conclusion: string;
}

interface ApiServiceTask {
  id?: string;
  budget_item_id?: string | null;
  description: string;
  status: ServiceTask["status"];
  notes: string;
  images: string[];
  completed_at?: string | null;
}

interface ApiPaymentRecord {
  document_type: PaymentRecord["documentType"];
  paid: boolean;
  payment_method: string;
  amount_paid: number;
  paid_at?: string | null;
  fiscal_provider_reference?: string | null;
}

interface ApiServiceOrder {
  id: string;
  client_id?: string | null;
  client_name: string;
  client_phone: string;
  vehicle_id?: string | null;
  vehicle_label: string;
  stage: ServiceOrder["stage"];
  status: ServiceOrder["status"];
  diagnosis: ApiDiagnosisRecord;
  budget_id?: string | null;
  budget_items: ApiBudgetItem[];
  service_tasks: ApiServiceTask[];
  payment: ApiPaymentRecord;
  ready_message: string;
  created_at: string | null;
  updated_at: string | null;
  completed_at?: string | null;
}

interface ApiCompanySettings {
  id: string;
  trade_name: string;
  legal_name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city_uf: string;
  cep: string;
  technical_responsible: string;
  fiscal_provider?: string | null;
  fiscal_provider_enabled: boolean;
  updated_at?: string | null;
}

interface ApiFixedCost {
  id: string;
  description: string;
  amount: number;
  recurrence: FixedCost["recurrence"];
  due_day: number;
  alert_enabled: boolean;
  active: boolean;
  created_at?: string | null;
}

interface ApiAppSnapshot {
  clients: ApiClient[];
  budgets: ApiBudget[];
  service_reports: ApiServiceReport[];
  service_orders?: ApiServiceOrder[];
  reminders: ApiReminder[];
  financial_entries: ApiFinancialEntry[];
  company_settings?: ApiCompanySettings;
  fixed_costs?: ApiFixedCost[];
}

const configuredMode = import.meta.env.VITE_DATA_MODE?.toLowerCase() === "mock" ? "mock" : "api";
const mockLatencyMs = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? "0");

async function fetchJson<T>(url: string): Promise<T> {
  const response = await trackDbOperation(fetch(url));

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function mapVehicle(vehicle: ApiVehicle): Vehicle {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    plate: vehicle.plate,
    year: vehicle.year,
    color: vehicle.color ?? undefined,
    mileage: vehicle.mileage,
    status: vehicle.status,
  };
}

function mapClient(client: ApiClient): Client {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    cpfCnpj: client.cpf_cnpj ?? "",
    email: client.email,
    city: client.city,
    lifetimeValue: client.lifetime_value,
    lastVisit: client.last_visit ?? "",
    vehicles: (client.vehicles ?? []).map(mapVehicle),
  };
}

function mapBudgetItem(item: ApiBudgetItem, index: number, budgetId: string): BudgetItem {
  return {
    id: item.id ?? `${budgetId}_item_${index + 1}`,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unit_price,
  };
}

function mapBudget(budget: ApiBudget): Budget {
  return {
    id: budget.id,
    clientName: budget.client_name,
    vehicleLabel: budget.vehicle_label,
    status: budget.status,
    laborValue: budget.labor_value,
    createdAt: budget.created_at ?? "",
    items: budget.items.map((item, index) => mapBudgetItem(item, index, budget.id)),
    notes: budget.notes,
  };
}

function mapChecklistItem(item: ApiChecklistItem, index: number, reportId: string): ServiceChecklistItem {
  return {
    id: item.id ?? `${reportId}_check_${index + 1}`,
    label: item.label,
    done: item.done,
    notes: item.notes ?? undefined,
  };
}

function mapServiceReport(report: ApiServiceReport): ServiceReport {
  return {
    id: report.id,
    title: report.title,
    clientName: report.client_name,
    vehicleLabel: report.vehicle_label,
    checkInAt: report.check_in_at ?? "",
    status: report.status,
    mechanic: report.mechanic,
    notes: report.notes,
    images: report.images,
    checklist: report.checklist.map((item, index) => mapChecklistItem(item, index, report.id)),
  };
}

function mapReminder(reminder: ApiReminder): Reminder {
  return {
    id: reminder.id,
    title: reminder.title,
    clientName: reminder.client_name,
    channel: reminder.channel,
    dueAt: reminder.due_at,
    recurrence: reminder.recurrence,
    status: reminder.status,
  };
}

function mapFinancialEntry(entry: ApiFinancialEntry): FinancialEntry {
  return {
    id: entry.id,
    type: entry.type,
    category: entry.category,
    documentType: entry.document_type,
    description: entry.description,
    amount: entry.amount,
    issuedAt: entry.issued_at,
    referenceMonth: entry.reference_month,
    status: entry.status,
  };
}

function mapDiagnosis(record: ApiDiagnosisRecord): DiagnosisRecord {
  return {
    customerComplaint: record.customer_complaint,
    mechanicDiagnosis: record.mechanic_diagnosis,
    diagnosticTool: record.diagnostic_tool,
    dtcCodes: record.dtc_codes,
    conclusion: record.conclusion,
  };
}

function mapPayment(record: ApiPaymentRecord): PaymentRecord {
  return {
    documentType: record.document_type,
    paid: record.paid,
    paymentMethod: record.payment_method,
    amountPaid: record.amount_paid,
    paidAt: record.paid_at ?? undefined,
    fiscalProviderReference: record.fiscal_provider_reference ?? undefined,
  };
}

function mapServiceTask(task: ApiServiceTask, index: number): ServiceTask {
  return {
    id: task.id ?? `task_${index + 1}`,
    budgetItemId: task.budget_item_id ?? undefined,
    description: task.description,
    status: task.status,
    notes: task.notes,
    images: task.images,
    completedAt: task.completed_at ?? undefined,
  };
}

function mapServiceOrder(order: ApiServiceOrder): ServiceOrder {
  return {
    id: order.id,
    clientId: order.client_id ?? undefined,
    clientName: order.client_name,
    clientPhone: order.client_phone,
    vehicleId: order.vehicle_id ?? undefined,
    vehicleLabel: order.vehicle_label,
    stage: order.stage,
    status: order.status,
    diagnosis: mapDiagnosis(order.diagnosis),
    budgetId: order.budget_id ?? undefined,
    budgetItems: order.budget_items.map((item, index) => mapBudgetItem(item, index, order.id)),
    serviceTasks: order.service_tasks.map(mapServiceTask),
    payment: mapPayment(order.payment),
    readyMessage: order.ready_message,
    createdAt: order.created_at ?? "",
    updatedAt: order.updated_at ?? "",
    completedAt: order.completed_at ?? undefined,
  };
}

function mapCompanySettings(settings: ApiCompanySettings): CompanySettings {
  return {
    id: settings.id,
    tradeName: settings.trade_name,
    legalName: settings.legal_name,
    cnpj: settings.cnpj,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    cityUf: settings.city_uf,
    cep: settings.cep,
    technicalResponsible: settings.technical_responsible,
    fiscalProvider: settings.fiscal_provider ?? undefined,
    fiscalProviderEnabled: settings.fiscal_provider_enabled,
    updatedAt: settings.updated_at ?? undefined,
  };
}

function mapFixedCost(cost: ApiFixedCost): FixedCost {
  return {
    id: cost.id,
    description: cost.description,
    amount: cost.amount,
    recurrence: cost.recurrence,
    dueDay: cost.due_day,
    alertEnabled: cost.alert_enabled,
    active: cost.active,
    createdAt: cost.created_at ?? undefined,
  };
}

async function getMockSnapshot(): Promise<AppDataSnapshot> {
  if (mockLatencyMs > 0) {
    await sleep(mockLatencyMs);
  }

  return cloneMockAppSnapshot();
}

async function getApiSnapshot(): Promise<AppDataSnapshot> {
  const snapshot = await fetchJson<ApiAppSnapshot>(apiConfig.endpoints.appSnapshot);

  return {
    clients: snapshot.clients.map(mapClient),
    budgets: snapshot.budgets.map(mapBudget),
    serviceReports: snapshot.service_reports.map(mapServiceReport),
    serviceOrders: (snapshot.service_orders ?? []).map(mapServiceOrder),
    reminders: snapshot.reminders.map(mapReminder),
    financialEntries: snapshot.financial_entries.map(mapFinancialEntry),
    companySettings: snapshot.company_settings ? mapCompanySettings(snapshot.company_settings) : undefined,
    fixedCosts: (snapshot.fixed_costs ?? []).map(mapFixedCost),
  };
}

export const dataClient = {
  mode: configuredMode as DataMode,
  getAppSnapshot(): Promise<AppDataSnapshot> {
    return configuredMode === "api" ? getApiSnapshot() : getMockSnapshot();
  },
};
