import type {
  Budget,
  Client,
  FinancialEntry,
  Reminder,
  ServiceReport,
} from "./domain";

export interface AppDataSnapshot {
  clients: Client[];
  budgets: Budget[];
  serviceReports: ServiceReport[];
  reminders: Reminder[];
  financialEntries: FinancialEntry[];
}
