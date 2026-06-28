export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  mileage: number;
  status: "Em dia" | "Revisao em aberto" | "Urgente";
}

export interface Client {
  id: string;
  name: string;
  phone: string;
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
