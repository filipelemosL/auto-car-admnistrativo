import type {
  Budget,
  Client,
  CompanySettings,
  FixedCost,
  FinancialEntry,
  Reminder,
  ServiceOrder,
  ServiceReport,
} from "../types/domain";
import type { AppDataSnapshot } from "../types/appData";

const clients: Client[] = [
  {
    id: "cli_001",
    name: "Marina Costa",
    phone: "(11) 98877-1100",
    cpfCnpj: "123.456.789-00",
    email: "marina@exemplo.com",
    city: "Sao Paulo",
    lifetimeValue: 12480,
    lastVisit: "2026-06-15T10:00:00.000Z",
    vehicles: [
      {
        id: "veh_001",
        brand: "Toyota",
        model: "Corolla XEi",
        plate: "BRA2E19",
        year: 2021,
        color: "Prata",
        mileage: 58210,
        status: "Revisao em aberto",
      },
      {
        id: "veh_002",
        brand: "Honda",
        model: "Fit EXL",
        plate: "HND4M52",
        year: 2018,
        color: "Branco",
        mileage: 73400,
        status: "Em dia",
      },
    ],
  },
  {
    id: "cli_002",
    name: "Carlos Mendes",
    phone: "(11) 99111-2200",
    cpfCnpj: "987.654.321-00",
    email: "carlos@exemplo.com",
    city: "Osasco",
    lifetimeValue: 8450,
    lastVisit: "2026-06-21T14:00:00.000Z",
    vehicles: [
      {
        id: "veh_003",
        brand: "Volkswagen",
        model: "Saveiro Cross",
        plate: "SVR9P11",
        year: 2020,
        color: "Vermelho",
        mileage: 91230,
        status: "Urgente",
      },
    ],
  },
  {
    id: "cli_003",
    name: "Juliana Araujo",
    phone: "(11) 97770-1009",
    cpfCnpj: "321.654.987-00",
    email: "juliana@exemplo.com",
    city: "Barueri",
    lifetimeValue: 5630,
    lastVisit: "2026-05-19T08:30:00.000Z",
    vehicles: [
      {
        id: "veh_004",
        brand: "Jeep",
        model: "Renegade Longitude",
        plate: "JEP3G45",
        year: 2022,
        color: "Cinza",
        mileage: 30110,
        status: "Em dia",
      },
    ],
  },
];

const budgets: Budget[] = [
  {
    id: "orc_001",
    clientName: "Marina Costa",
    vehicleLabel: "Toyota Corolla XEi 2021",
    status: "Enviado",
    laborValue: 480,
    createdAt: "2026-06-24T12:00:00.000Z",
    notes: "Prazo estimado de 2 dias uteis apos aprovacao.",
    items: [
      { id: "item_001", description: "Jogo de pastilhas dianteiras", quantity: 1, unitPrice: 320 },
      { id: "item_002", description: "Troca de fluido de freio", quantity: 1, unitPrice: 140 },
    ],
  },
  {
    id: "orc_002",
    clientName: "Carlos Mendes",
    vehicleLabel: "Volkswagen Saveiro Cross 2020",
    status: "Rascunho",
    laborValue: 350,
    createdAt: "2026-06-25T09:30:00.000Z",
    notes: "Necessario confirmar disponibilidade da peca.",
    items: [
      { id: "item_003", description: "Amortecedor dianteiro", quantity: 2, unitPrice: 510 },
      { id: "item_004", description: "Alinhamento e balanceamento", quantity: 1, unitPrice: 180 },
    ],
  },
];

const serviceReports: ServiceReport[] = [
  {
    id: "srv_001",
    title: "OS 1042",
    clientName: "Carlos Mendes",
    vehicleLabel: "Volkswagen Saveiro Cross 2020",
    checkInAt: "2026-06-25T11:20:00.000Z",
    status: "Em execucao",
    mechanic: "Rafael Gomes",
    notes: [
      "Ruido na suspensao dianteira confirmado no teste de rua.",
      "Cliente autorizou fotografar desgaste da bandeja.",
    ],
    images: ["https://images.unsplash.com/photo-1487754180451-c456f719a1fc"],
    checklist: [
      { id: "chk_001", label: "Inspecao de bandejas", done: true },
      { id: "chk_002", label: "Teste de amortecedores", done: true },
      { id: "chk_003", label: "Conferencia de terminais", done: false, notes: "Aguardando elevador livre" },
    ],
  },
  {
    id: "srv_002",
    title: "OS 1038",
    clientName: "Marina Costa",
    vehicleLabel: "Toyota Corolla XEi 2021",
    checkInAt: "2026-06-24T08:45:00.000Z",
    status: "Aguardando peca",
    mechanic: "Bruno Lima",
    notes: ["Discos com desgaste acima do recomendado.", "Aguardando chegada do kit de freios."],
    images: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341",
    ],
    checklist: [
      { id: "chk_004", label: "Medicao de discos", done: true },
      { id: "chk_005", label: "Leitura de falhas", done: true },
      { id: "chk_006", label: "Teste final", done: false },
    ],
  },
];

const reminders: Reminder[] = [
  {
    id: "rem_001",
    title: "Retorno de revisao de 10.000 km",
    clientName: "Juliana Araujo",
    channel: "WhatsApp",
    dueAt: "2026-06-28T14:00:00.000Z",
    recurrence: "Mensal",
    status: "Agendado",
  },
  {
    id: "rem_002",
    title: "Cobrar aprovacao do orcamento OS 1042",
    clientName: "Carlos Mendes",
    channel: "Ligacao",
    dueAt: "2026-06-26T16:30:00.000Z",
    recurrence: "Unico",
    status: "Pendente",
  },
  {
    id: "rem_003",
    title: "Enviar lembrete de troca de oleo",
    clientName: "Marina Costa",
    channel: "Email",
    dueAt: "2026-07-02T09:00:00.000Z",
    recurrence: "Trimestral",
    status: "Agendado",
  },
];

const financialEntries: FinancialEntry[] = [
  {
    id: "fin_001",
    type: "Receita",
    category: "Servicos",
    documentType: "NF",
    description: "OS 1038 - freios dianteiros",
    amount: 1790,
    issuedAt: "2026-06-24T18:00:00.000Z",
    referenceMonth: "2026-06",
    status: "Emitido",
  },
  {
    id: "fin_002",
    type: "Custo",
    category: "Pecas",
    documentType: "Despesa",
    description: "Compra de kit de freio",
    amount: 980,
    issuedAt: "2026-06-24T09:00:00.000Z",
    referenceMonth: "2026-06",
    status: "Pago",
  },
  {
    id: "fin_003",
    type: "Receita",
    category: "Servicos",
    documentType: "Recibo",
    description: "Alinhamento e balanceamento",
    amount: 320,
    issuedAt: "2026-06-25T13:00:00.000Z",
    referenceMonth: "2026-06",
    status: "Pendente",
  },
];

const serviceOrders: ServiceOrder[] = [
  {
    id: "jor_001",
    clientId: "cli_002",
    clientName: "Carlos Mendes",
    clientPhone: "(11) 99111-2200",
    vehicleId: "veh_003",
    vehicleLabel: "Volkswagen Saveiro Cross 2020",
    stage: "service",
    status: "Em servico",
    diagnosis: {
      customerComplaint: "Cliente relata ruido na suspensao dianteira.",
      mechanicDiagnosis: "Folga identificada em componentes dianteiros.",
      diagnosticTool: "Teste de rua + elevador",
      dtcCodes: "Nenhum DTC registrado",
      conclusion: "Necessaria substituicao e conferencia dos terminais.",
    },
    budgetId: "orc_001",
    budgetItems: [
      { id: "item_001", description: "Jogo de pastilhas dianteiras", quantity: 1, unitPrice: 320 },
      { id: "item_002", description: "Troca de fluido de freio", quantity: 1, unitPrice: 140 },
    ],
    serviceTasks: [
      {
        id: "tsk_001",
        budgetItemId: "item_001",
        description: "Jogo de pastilhas dianteiras",
        status: "Em andamento",
        notes: "Desmontagem iniciada.",
        images: [],
      },
      {
        id: "tsk_002",
        budgetItemId: "item_002",
        description: "Troca de fluido de freio",
        status: "Aguardando inicio",
        notes: "",
        images: [],
      },
    ],
    payment: {
      documentType: "Recibo",
      paid: false,
      paymentMethod: "",
      amountPaid: 0,
    },
    readyMessage: "",
    createdAt: "2026-06-25T11:20:00.000Z",
    updatedAt: "2026-06-25T11:20:00.000Z",
  },
];

const companySettings: CompanySettings = {
  id: "company_default",
  tradeName: "AutoCar",
  legalName: "AutoCar Oficina Mecanica",
  cnpj: "",
  phone: "(11) 4002-8922",
  email: "contato@autocar.local",
  address: "Av. Principal, 100",
  cityUf: "Sao Paulo / SP",
  cep: "01000-000",
  technicalResponsible: "Carlos Mecanico",
  fiscalProviderEnabled: false,
  updatedAt: "2026-06-25T11:20:00.000Z",
};

const fixedCosts: FixedCost[] = [
  {
    id: "fix_001",
    description: "Energia eletrica",
    amount: 680,
    recurrence: "Mensal",
    dueDay: 12,
    alertEnabled: true,
    active: true,
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "fix_002",
    description: "Aluguel da oficina",
    amount: 3200,
    recurrence: "Mensal",
    dueDay: 5,
    alertEnabled: true,
    active: true,
    createdAt: "2026-06-01T10:00:00.000Z",
  },
];

export const mockAppSnapshot: AppDataSnapshot = {
  clients,
  budgets,
  serviceReports,
  serviceOrders,
  reminders,
  financialEntries,
  companySettings,
  fixedCosts,
};

export const emptyAppSnapshot: AppDataSnapshot = {
  clients: [],
  budgets: [],
  serviceReports: [],
  serviceOrders: [],
  reminders: [],
  financialEntries: [],
  fixedCosts: [],
};

export function cloneMockAppSnapshot(): AppDataSnapshot {
  return JSON.parse(JSON.stringify(mockAppSnapshot)) as AppDataSnapshot;
}

export { budgets, clients, companySettings, financialEntries, fixedCosts, reminders, serviceOrders, serviceReports };
