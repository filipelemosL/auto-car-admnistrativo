import type {
  Budget,
  Client,
  CompanySettings,
  FixedCost,
  FinancialEntry,
  Reminder,
  ServiceOrder,
  ServiceReport,
} from "./domain";

export interface AppDataSnapshot {
  clients: Client[];
  budgets: Budget[];
  serviceReports: ServiceReport[];
  serviceOrders: ServiceOrder[];
  reminders: Reminder[];
  financialEntries: FinancialEntry[];
  companySettings?: CompanySettings;
  fixedCosts?: FixedCost[];
}
