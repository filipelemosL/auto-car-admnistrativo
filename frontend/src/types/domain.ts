export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color?: string;
  mileage: number;
  status: "Em dia" | "Revisao em aberto" | "Urgente";
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  cpfCnpj: string;
  email: string;
  city: string;
  lifetimeValue: number;
  lastVisit: string;
  vehicles: Vehicle[];
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Budget {
  id: string;
  clientName: string;
  vehicleLabel: string;
  status: "Rascunho" | "Enviado" | "Aprovado" | "Recusado";
  laborValue: number;
  createdAt: string;
  items: BudgetItem[];
  notes: string;
}

export interface ServiceChecklistItem {
  id: string;
  label: string;
  done: boolean;
  notes?: string;
}

export interface ServiceReport {
  id: string;
  title: string;
  clientName: string;
  vehicleLabel: string;
  checkInAt: string;
  status: "Em execucao" | "Aguardando peca" | "Concluido";
  mechanic: string;
  notes: string[];
  images: string[];
  checklist: ServiceChecklistItem[];
}

export interface Reminder {
  id: string;
  title: string;
  clientName: string;
  channel: "WhatsApp" | "Ligacao" | "Email";
  dueAt: string;
  recurrence: "Unico" | "Semanal" | "Mensal" | "Trimestral" | "Anual";
  status: "Agendado" | "Pendente" | "Concluido";
}

export interface FinancialEntry {
  id: string;
  type: "Receita" | "Custo";
  category: string;
  documentType: "NF" | "Recibo" | "Despesa";
  description: string;
  amount: number;
  issuedAt: string;
  referenceMonth: string;
  status: "Emitido" | "Pago" | "Pendente";
}

export interface DiagnosisRecord {
  customerComplaint: string;
  mechanicDiagnosis: string;
  diagnosticTool: string;
  dtcCodes: string;
  conclusion: string;
}

export interface ServiceTask {
  id: string;
  budgetItemId?: string;
  description: string;
  status: "Aguardando inicio" | "Em andamento" | "Aguardando pecas" | "Concluido";
  notes: string;
  images: string[];
  completedAt?: string;
}

export interface PaymentRecord {
  documentType: "NF" | "Recibo";
  paid: boolean;
  paymentMethod: string;
  amountPaid: number;
  paidAt?: string;
  fiscalProviderReference?: string;
}

export interface ServiceOrder {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  vehicleId?: string;
  vehicleLabel: string;
  stage: "client_selection" | "diagnosis" | "budget" | "service" | "notification" | "finance" | "completed";
  status: "Aberta" | "Aguardando aprovacao" | "Em servico" | "Aguardando pagamento" | "Concluida";
  diagnosis: DiagnosisRecord;
  budgetId?: string;
  budgetItems: BudgetItem[];
  serviceTasks: ServiceTask[];
  payment: PaymentRecord;
  readyMessage: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CompanySettings {
  id: string;
  tradeName: string;
  legalName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  cityUf: string;
  cep: string;
  technicalResponsible: string;
  fiscalProvider?: string;
  fiscalProviderEnabled: boolean;
  updatedAt?: string;
}

export interface FixedCost {
  id: string;
  description: string;
  amount: number;
  recurrence: "Mensal" | "Trimestral" | "Anual";
  dueDay: number;
  alertEnabled: boolean;
  active: boolean;
  createdAt?: string;
}
