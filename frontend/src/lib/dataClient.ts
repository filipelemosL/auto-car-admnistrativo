import { apiConfig } from "./api";
import { cloneMockAppSnapshot } from "../data/mockData";
import type { AppDataSnapshot } from "../types/appData";
import type {
  Budget,
  BudgetItem,
  Client,
  FinancialEntry,
  Reminder,
  ServiceChecklistItem,
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
  mileage: number;
  status: Vehicle["status"];
}

interface ApiClient {
  id: string;
  name: string;
  phone: string;
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

const configuredMode = import.meta.env.VITE_DATA_MODE?.toLowerCase() === "api" ? "api" : "mock";
const mockLatencyMs = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? "0");

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

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
    mileage: vehicle.mileage,
    status: vehicle.status,
  };
}

function mapClient(client: ApiClient): Client {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
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

async function getMockSnapshot(): Promise<AppDataSnapshot> {
  if (mockLatencyMs > 0) {
    await sleep(mockLatencyMs);
  }

  return cloneMockAppSnapshot();
}

async function getApiSnapshot(): Promise<AppDataSnapshot> {
  const [clients, budgets, serviceReports, reminders, financialEntries] = await Promise.all([
    fetchJson<ApiClient[]>(apiConfig.endpoints.clients),
    fetchJson<ApiBudget[]>(apiConfig.endpoints.budgets),
    fetchJson<ApiServiceReport[]>(apiConfig.endpoints.serviceReports),
    fetchJson<ApiReminder[]>(apiConfig.endpoints.reminders),
    fetchJson<ApiFinancialEntry[]>(apiConfig.endpoints.finance),
  ]);

  return {
    clients: clients.map(mapClient),
    budgets: budgets.map(mapBudget),
    serviceReports: serviceReports.map(mapServiceReport),
    reminders: reminders.map(mapReminder),
    financialEntries: financialEntries.map(mapFinancialEntry),
  };
}

export const dataClient = {
  mode: configuredMode as DataMode,
  getAppSnapshot(): Promise<AppDataSnapshot> {
    return configuredMode === "api" ? getApiSnapshot() : getMockSnapshot();
  },
};
