import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  DollarSign,
  Eye,
  FileImage,
  FilePlus2,
  FileText,
  Gauge,
  History,
  Image,
  MessageCircle,
  Plus,
  ReceiptText,
  Repeat,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Share2,
  Wifi,
  WifiOff,
  Trash2,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAppData } from "./context/AppDataContext";
import { trackDbOperation, useDbLoading } from "./lib/dbLoading";
import { buildBudgetWhatsappPreview, buildServiceReportSummary } from "./lib/exportTemplates";
import { formatCurrency, formatDate, formatDateTime } from "./lib/formatters";
import type { Budget, Client, FinancialEntry, Reminder, ServiceOrder, ServiceReport, ServiceTask, Vehicle } from "./types/domain";

type WorkspacePanel = "jornada" | "servicos" | "clientes" | "orcamentos" | "financeiro" | "alertas";

type PanelStat = {
  label: string;
  value: string;
};

type ToolItem = {
  icon: LucideIcon;
  label: string;
  description: string;
  href?: string;
  external?: boolean;
  preview?: string;
};

type JourneyClientFlow = "choice" | "select" | "create";

type VehicleForm = {
  brand: string;
  model: string;
  year: string;
  color: string;
  plate: string;
};

type DiagnosisServiceDraft = {
  id: string;
  name: string;
};

type BudgetLineType = "labor" | "part" | "preset";

type BudgetLineDraft = {
  id: string;
  type: BudgetLineType;
  description: string;
  value: number;
};

type BudgetServiceDraft = {
  id: string;
  name: string;
  lines: BudgetLineDraft[];
};

type BudgetEditorDraft = {
  serviceId: string;
  kind: "" | BudgetLineType;
  partName: string;
  value: string;
};

type BudgetPresetDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  itemType: "Servico" | "Peca";
};

type DiagnosisPrintData = {
  complaint: string;
  mechanicDiagnosis: string;
  diagnosticTool: string;
  dtcCodes: string;
  conclusion: string;
  services: DiagnosisServiceDraft[];
};

const serviceStatusOptions: ServiceTask["status"][] = ["Aguardando inicio", "Aguardando pecas", "Em andamento", "Concluido"];
const paymentMethodOptions = ["PIX", "Dinheiro", "Crédito", "Débito"];

const vehicleBrandOptions = ["Toyota", "Volkswagen", "Jeep", "Ford", "Chevrolet", "Mitsubishi", "Fiat", "Renault", "Hyundai", "Honda", "Outro"];

const emptyVehicleForm = (): VehicleForm => ({
  brand: "Toyota",
  model: "",
  year: String(new Date().getFullYear()),
  color: "",
  plate: "",
});

const asset = (name: string) => `/assets/${name}`;
const emittedFile = (name: string) => `/assets/files/${name}`;

const emittedFiles = {
  budget: emittedFile("autocar_orcamento.docx"),
  report: emittedFile("autocar_relatorio.docx"),
  nfe: emittedFile("autocar_nfe.docx"),
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

function showSystemError(message: string, title = "Nao foi possivel continuar") {
  return Swal.fire({
    title,
    text: message,
    icon: "error",
    confirmButtonText: "Entendi",
    confirmButtonColor: "#D92D20",
    background: "#111111",
    color: "#F8FAFC",
  });
}

function showSystemSuccess(message: string, title = "Tudo certo") {
  return Swal.fire({
    title,
    text: message,
    icon: "success",
    confirmButtonText: "Ok",
    confirmButtonColor: "#1F8A4C",
    background: "#111111",
    color: "#F8FAFC",
  });
}

async function confirmSystemAction(message: string, title = "Confirmar acao") {
  const result = await Swal.fire({
    title,
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#D9A300",
    cancelButtonColor: "#475569",
    background: "#111111",
    color: "#F8FAFC",
  });
  return result.isConfirmed;
}

async function promptSystemText(message: string, defaultValue = "", title = "Informe os dados") {
  const result = await Swal.fire({
    title,
    text: message,
    input: "text",
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonText: "Adicionar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#D9A300",
    cancelButtonColor: "#475569",
    background: "#111111",
    color: "#F8FAFC",
    inputValidator: (value) => (!value.trim() ? "Preencha este campo para continuar." : undefined),
  });
  return result.isConfirmed ? result.value.trim() : "";
}

function buildWhatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildDiagnosisMessage(order: ServiceOrder, diagnosis: DiagnosisPrintData) {
  return [
    "*AutoCar - Diagnostico tecnico*",
    `Cliente: ${order.clientName || "Nao informado"}`,
    `Veiculo: ${order.vehicleLabel || "Nao informado"}`,
    `Data: ${formatDate(new Date().toISOString())}`,
    "",
    "*Queixa do cliente*",
    diagnosis.complaint || "Nao informada.",
    "",
    "*Diagnostico do mecanico*",
    diagnosis.mechanicDiagnosis || "Diagnostico inicial pendente.",
    "",
    "*Ferramenta / procedimento*",
    diagnosis.diagnosticTool || "Nao informado.",
    "",
    "*DTC / codigos de falha*",
    diagnosis.dtcCodes || "Nenhum DTC registrado.",
    "",
    "*Servicos indicados*",
    ...(diagnosis.services.length ? diagnosis.services.map((service, index) => `${index + 1}. ${service.name}`) : ["Nenhum servico indicado ainda."]),
    "",
    "*Conclusao*",
    diagnosis.conclusion || diagnosis.mechanicDiagnosis || diagnosis.complaint || "Diagnostico registrado.",
  ].join("\n");
}

function openDiagnosisPrintDocument(order: ServiceOrder, diagnosis: DiagnosisPrintData) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    return;
  }

  const services = diagnosis.services.length
    ? diagnosis.services.map((service, index) => `<li><strong>${index + 1}.</strong> ${escapeHtml(service.name)}</li>`).join("")
    : "<li>Nenhum servico indicado ainda.</li>";
  const conclusion = diagnosis.conclusion || diagnosis.mechanicDiagnosis || diagnosis.complaint || "Diagnostico registrado.";

  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Diagnostico tecnico - ${escapeHtml(order.clientName || "Cliente")}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { color: #111827; font-family: Arial, sans-serif; line-height: 1.45; margin: 0; }
          header { border-bottom: 2px solid #111827; margin-bottom: 18px; padding-bottom: 12px; }
          h1 { font-size: 22px; margin: 0 0 6px; text-transform: uppercase; }
          h2 { border-bottom: 1px solid #d1d5db; font-size: 14px; margin: 18px 0 8px; padding-bottom: 4px; text-transform: uppercase; }
          p { margin: 0; white-space: pre-wrap; }
          ul { margin: 0; padding-left: 18px; }
          li { margin: 4px 0; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; font-size: 12px; }
          .meta strong { display: block; font-size: 10px; text-transform: uppercase; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 54px; }
          .signature { border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <header>
          <h1>Diagnostico tecnico</h1>
          <div class="meta">
            <span><strong>Cliente</strong>${escapeHtml(order.clientName || "Nao informado")}</span>
            <span><strong>WhatsApp</strong>${escapeHtml(order.clientPhone || "Nao informado")}</span>
            <span><strong>Veiculo</strong>${escapeHtml(order.vehicleLabel || "Nao informado")}</span>
            <span><strong>Data</strong>${escapeHtml(formatDate(new Date().toISOString()))}</span>
          </div>
        </header>
        <section>
          <h2>Queixa do cliente</h2>
          <p>${escapeHtml(diagnosis.complaint || "Nao informada.")}</p>
        </section>
        <section>
          <h2>Diagnostico do mecanico</h2>
          <p>${escapeHtml(diagnosis.mechanicDiagnosis || "Diagnostico inicial pendente.")}</p>
        </section>
        <section>
          <h2>Ferramenta / procedimento</h2>
          <p>${escapeHtml(diagnosis.diagnosticTool || "Nao informado.")}</p>
        </section>
        <section>
          <h2>DTC / codigos de falha</h2>
          <p>${escapeHtml(diagnosis.dtcCodes || "Nenhum DTC registrado.")}</p>
        </section>
        <section>
          <h2>Servicos indicados</h2>
          <ul>${services}</ul>
        </section>
        <section>
          <h2>Conclusao tecnica</h2>
          <p>${escapeHtml(conclusion)}</p>
        </section>
        <div class="signatures">
          <div class="signature">Responsavel tecnico</div>
          <div class="signature">Cliente</div>
        </div>
        <script>window.addEventListener("load", () => window.print());</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await trackDbOperation(
    fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }),
  );

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      if (Array.isArray(errorBody.detail)) {
        detail = errorBody.detail
          .map((item: any) => `${item.loc?.join(".") ?? "campo"}: ${item.msg}`)
          .join("; ");
      } else if (errorBody.detail) {
        detail = String(errorBody.detail);
      }
    } catch {
      detail = "";
    }
    throw new Error(`Falha na API ${path}: ${response.status}${detail ? ` - ${detail}` : ""}`);
  }

  return (await response.json()) as T;
}

function parseMoney(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyInput(value: string) {
  return formatCurrency(parseMoney(value));
}

function buildBudgetServicesFromItems(items: ServiceOrder["budgetItems"] = []): BudgetServiceDraft[] {
  if (!items.length) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    name: item.description,
    lines: item.unitPrice > 0 ? [{ id: `${item.id}_valor`, type: "labor", description: item.description, value: item.unitPrice * item.quantity }] : [],
  }));
}

function flattenBudgetServiceItems(services: BudgetServiceDraft[]) {
  return services.flatMap((service) => {
    const lines = service.lines.length
      ? service.lines
      : [{ id: `${service.id}_placeholder`, type: "labor" as const, description: service.name, value: 0 }];

    return lines.map((line) => ({
      id: line.id,
      description: `${service.name} - ${line.description}`,
      quantity: 1,
      unit_price: line.value,
    }));
  });
}

function mapApiOrder(order: any): ServiceOrder {
  return {
    id: order.id,
    clientId: order.client_id ?? undefined,
    clientName: order.client_name,
    clientPhone: order.client_phone,
    vehicleId: order.vehicle_id ?? undefined,
    vehicleLabel: order.vehicle_label,
    stage: order.stage,
    status: order.status,
    diagnosis: {
      customerComplaint: order.diagnosis?.customer_complaint ?? "",
      mechanicDiagnosis: order.diagnosis?.mechanic_diagnosis ?? "",
      diagnosticTool: order.diagnosis?.diagnostic_tool ?? "",
      dtcCodes: order.diagnosis?.dtc_codes ?? "",
      conclusion: order.diagnosis?.conclusion ?? "",
    },
    budgetId: order.budget_id ?? undefined,
    budgetItems: (order.budget_items ?? []).map((item: any, index: number) => ({
      id: item.id ?? `${order.id}_item_${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
    serviceTasks: (order.service_tasks ?? []).map((task: any, index: number) => ({
      id: task.id ?? `${order.id}_task_${index}`,
      budgetItemId: task.budget_item_id ?? undefined,
      description: task.description,
      status: task.status,
      notes: task.notes ?? "",
      images: task.images ?? [],
      completedAt: task.completed_at ?? undefined,
    })),
    payment: {
      documentType: order.payment?.document_type ?? "Recibo",
      paid: order.payment?.paid ?? false,
      paymentMethod: order.payment?.payment_method ?? "",
      amountPaid: order.payment?.amount_paid ?? 0,
      paidAt: order.payment?.paid_at ?? undefined,
      fiscalProviderReference: order.payment?.fiscal_provider_reference ?? undefined,
    },
    readyMessage: order.ready_message ?? "",
    createdAt: order.created_at ?? "",
    updatedAt: order.updated_at ?? "",
    completedAt: order.completed_at ?? undefined,
  };
}

function clientMatchesSearch(client: Client, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    client.name,
    client.phone,
    client.cpfCnpj,
    ...client.vehicles.flatMap((vehicle) => [vehicle.brand, vehicle.model, vehicle.plate, vehicle.color ?? ""]),
  ].join(" ").toLowerCase();
  return haystack.includes(normalized);
}

function serviceStatusLabel(status: ServiceTask["status"]) {
  const labels: Record<ServiceTask["status"], string> = {
    "Aguardando inicio": "Nao iniciado",
    "Aguardando pecas": "Aguardando peca",
    "Em andamento": "Em andamento",
    "Concluido": "Concluido",
  };
  return labels[status];
}

export default function App() {
  const { data, dataMode, error, loading } = useAppData();
  const pendingDbOperations = useDbLoading();
  const [activePanel, setActivePanel] = useState<WorkspacePanel>("orcamentos");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const clients = data.clients ?? [];
  const budgets = data.budgets ?? [];
  const serviceReports = data.serviceReports ?? [];
  const serviceOrders = data.serviceOrders ?? [];
  const reminders = data.reminders ?? [];
  const financialEntries = data.financialEntries ?? [];
  const latestReport = serviceReports[0];
  const selectedOrder = serviceOrders.find((order) => order.id === selectedOrderId);

  return (
    <main className="autocar-app">
      <section className="workspace-grid">
        <aside className="admin-side" aria-label="Area administrativa">
          <div className="admin-component">
            {activePanel === "jornada" ? <CustomerJourneyWorkspace key={selectedOrder?.id ?? "new-order"} clients={clients} order={selectedOrder} /> : null}
            {activePanel === "orcamentos" ? <BudgetLibraryWorkspace budgets={budgets} /> : null}
            {activePanel === "clientes" ? <ClientsWorkspace clients={clients} serviceOrders={serviceOrders} /> : null}
            {activePanel === "servicos" ? <ServiceWorkspace report={latestReport} /> : null}
            {activePanel === "alertas" ? <AlertsWorkspace reminders={reminders} /> : null}
            {activePanel === "financeiro" ? <FinanceWorkspace entries={financialEntries} /> : null}
          </div>
        </aside>

        <section className="operations-side" aria-label="Painel operacional">
          <div className="top-action-grid">
            <button className="start-service-card" aria-label="Iniciar atendimento" onClick={() => {
              setSelectedOrderId(null);
              setActivePanel("jornada");
            }}>
              <img src={asset("iniciar-atendimento.png")} alt="" />
            </button>
            <NotificationsCard reminders={reminders} onViewAll={() => setActivePanel("alertas")} />
          </div>

          <div className="shortcut-grid" aria-label="Atalhos administrativos">
            <ImageShortcut ariaLabel="Abrir clientes" image="card-clientes.png" active={activePanel === "clientes"} onClick={() => setActivePanel("clientes")} />
            <ImageShortcut ariaLabel="Abrir orcamentos" image="card-orcamento.png" active={activePanel === "orcamentos"} onClick={() => setActivePanel("orcamentos")} />
            <ImageShortcut ariaLabel="Abrir financeiro" image="card-financeiro.png" active={activePanel === "financeiro"} onClick={() => setActivePanel("financeiro")} />
            <ImageShortcut ariaLabel="Abrir alertas" image="card-alertas.png" active={activePanel === "alertas"} onClick={() => setActivePanel("alertas")} />
          </div>

          <ActiveServicesTable
            orders={serviceOrders}
            reports={serviceReports}
            onSelectOrder={(orderId) => {
              setSelectedOrderId(orderId);
              setActivePanel("jornada");
            }}
          />
        </section>
      </section>
      <SettingsDock
        connected={dataMode === "api" && !error}
        companyName={data.companySettings?.tradeName ?? "AutoCar"}
        settingsOpen={settingsOpen}
        onToggle={() => setSettingsOpen((current) => !current)}
      />
      <GlobalDbLoading visible={loading || pendingDbOperations > 0} />
    </main>
  );
}

function GlobalDbLoading({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="global-db-loading" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <strong>Sincronizando dados</strong>
    </div>
  );
}

function CustomerJourneyWorkspace({ clients, order }: { clients: Client[]; order?: ServiceOrder }) {
  const { reload } = useAppData();
  const [localOrder, setLocalOrder] = useState<ServiceOrder | undefined>(order);
  const [journeyStep, setJourneyStep] = useState<ServiceOrder["stage"]>(order?.stage ?? "client_selection");
  const [clientFlow, setClientFlow] = useState<JourneyClientFlow>(order ? "select" : "choice");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(order?.clientId ?? "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(order?.vehicleId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientCpfCnpj, setNewClientCpfCnpj] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientCity, setNewClientCity] = useState("");
  const [vehicleForms, setVehicleForms] = useState<VehicleForm[]>([emptyVehicleForm()]);
  const [complaint, setComplaint] = useState(order?.diagnosis.customerComplaint ?? "");
  const [mechanicDiagnosis, setMechanicDiagnosis] = useState(order?.diagnosis.mechanicDiagnosis ?? "");
  const [diagnosisServices, setDiagnosisServices] = useState<DiagnosisServiceDraft[]>(
    (order?.budgetItems ?? []).map((item) => ({ id: item.id, name: item.description })),
  );
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [budgetServices, setBudgetServices] = useState<BudgetServiceDraft[]>(buildBudgetServicesFromItems(order?.budgetItems ?? []));
  const [budgetEditor, setBudgetEditor] = useState<BudgetEditorDraft | null>(null);
  const [budgetPresets, setBudgetPresets] = useState<BudgetPresetDraft[]>([]);
  const [serviceTaskDrafts, setServiceTaskDrafts] = useState<ServiceTask[]>(order?.serviceTasks ?? []);
  const [photoDrafts, setPhotoDrafts] = useState<Record<string, string>>({});
  const [diagnosticTool, setDiagnosticTool] = useState(order?.diagnosis.diagnosticTool ?? "Scanner + teste de rua");
  const [dtcCodes, setDtcCodes] = useState(order?.diagnosis.dtcCodes ?? "Nenhum DTC registrado");
  const [paymentDocumentType, setPaymentDocumentType] = useState<"NF" | "Recibo">(order?.payment.documentType ?? "Recibo");
  const [paymentMethod, setPaymentMethod] = useState(order?.payment.paymentMethod ?? "PIX");
  const [amountPaid, setAmountPaid] = useState(order?.payment.amountPaid ? formatCurrency(order.payment.amountPaid) : "");
  const [actionError, setActionError] = useState<string | null>(null);
  const workingOrder = localOrder ?? order;
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients.find((client) => client.id === workingOrder?.clientId);
  const selectedVehicle = selectedClient?.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? selectedClient?.vehicles[0];
  const filteredClients = clients.filter((client) => clientMatchesSearch(client, clientSearch));
  const activeOrder: ServiceOrder = workingOrder ?? {
    id: "nova-jornada",
    clientId: selectedClient?.id,
    clientName: selectedClient?.name ?? "",
    clientPhone: selectedClient?.phone ?? "",
    vehicleId: selectedVehicle?.id,
    vehicleLabel: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year}` : "",
    stage: "client_selection",
    status: "Aberta",
    diagnosis: {
      customerComplaint: "",
      mechanicDiagnosis: "",
      diagnosticTool: "",
      dtcCodes: "",
      conclusion: "",
    },
    budgetItems: [],
    serviceTasks: [],
    payment: {
      documentType: "Recibo" as const,
      paid: false,
      paymentMethod: "",
      amountPaid: 0,
    },
    readyMessage: "",
    createdAt: "",
    updatedAt: "",
  };

  async function createClientFromForm() {
    setActionError(null);
    const validVehicles = vehicleForms
      .filter((vehicle) => vehicle.brand || vehicle.model || vehicle.plate || vehicle.color)
      .map((vehicle) => ({
        brand: vehicle.brand || "Nao informado",
        model: vehicle.model || "Modelo nao informado",
        plate: vehicle.plate || `SEMPLACA${Date.now().toString().slice(-4)}`,
        year: Number(vehicle.year) || new Date().getFullYear(),
        color: vehicle.color || "",
        mileage: 0,
        status: "Em dia",
      }));
    const createdClient = await apiJson<any>("/clients", {
      method: "POST",
      body: JSON.stringify({
        name: newClientName || "Cliente sem nome",
        phone: newClientPhone || "(00) 00000-0000",
        cpf_cnpj: newClientCpfCnpj,
        email: newClientEmail || "cliente@autocar.example.com",
        city: newClientCity || "Nao informado",
        lifetime_value: 0,
        vehicles: validVehicles,
      }),
    });
    setSelectedClientId(createdClient.id);
    setSelectedVehicleId(createdClient.vehicles?.[0]?.id ?? "");
    setClientFlow("select");
    await reload();
    return createdClient;
  }

  async function ensureOrder() {
    if (workingOrder?.id && workingOrder.id !== "nova-jornada") {
      return workingOrder;
    }

    const client = selectedClient ?? (await createClientFromForm());
    const vehicle = selectedVehicle ?? client.vehicles?.[0];
    const createdOrder = mapApiOrder(
      await apiJson<any>("/service-orders", {
        method: "POST",
        body: JSON.stringify({
          client_id: client.id,
          client_name: client.name,
          client_phone: client.phone,
          vehicle_id: vehicle?.id ?? null,
          vehicle_label: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "Veiculo nao informado",
          stage: "diagnosis",
          status: "Aberta",
        }),
      }),
    );
    setLocalOrder(createdOrder);
    await reload();
    return createdOrder;
  }

  async function runAction(action: () => Promise<void>) {
    try {
      setActionError(null);
      await action();
    } catch (error) {
      reportActionError(error instanceof Error ? error.message : "Falha ao executar acao.");
    }
  }

  function reportActionError(message: string) {
    setActionError(message);
    void showSystemError(message);
  }

  function updateVehicleForm(index: number, field: keyof VehicleForm, value: string) {
    setVehicleForms((current) => current.map((vehicle, vehicleIndex) => (vehicleIndex === index ? { ...vehicle, [field]: value } : vehicle)));
  }

  function addVehicleForm() {
    setVehicleForms((current) => [...current, emptyVehicleForm()]);
  }

  function removeVehicleForm(index: number) {
    setVehicleForms((current) => (current.length > 1 ? current.filter((_, vehicleIndex) => vehicleIndex !== index) : current));
  }

  async function createClientAndAdvance() {
    const createdClient = await createClientFromForm();
    const createdVehicle = createdClient.vehicles?.[0];
    const createdOrder = mapApiOrder(
      await apiJson<any>("/service-orders", {
        method: "POST",
        body: JSON.stringify({
          client_id: createdClient.id,
          client_name: createdClient.name,
          client_phone: createdClient.phone,
          vehicle_id: createdVehicle?.id ?? null,
          vehicle_label: createdVehicle ? `${createdVehicle.brand} ${createdVehicle.model} ${createdVehicle.year}` : "Veiculo nao informado",
          stage: "diagnosis",
          status: "Aberta",
        }),
      }),
    );
    setLocalOrder(createdOrder);
    await reload();
    setJourneyStep("diagnosis");
  }

  function chooseClient(client: Client, vehicleId?: string) {
    setSelectedClientId(client.id);
    setSelectedVehicleId(vehicleId ?? client.vehicles[0]?.id ?? "");
  }

  function addDiagnosisService() {
    const trimmedName = newServiceName.trim();
    if (!trimmedName) {
      reportActionError("Informe o nome do servico antes de adicionar.");
      return;
    }
    setDiagnosisServices((current) => [...current, { id: `diag_${Date.now()}_${current.length + 1}`, name: trimmedName }]);
    setNewServiceName("");
    setServiceFormOpen(false);
    setActionError(null);
  }

  function removeDiagnosisService(serviceId: string) {
    setDiagnosisServices((current) => current.filter((service) => service.id !== serviceId));
  }

  async function loadBudgetPresets() {
    if (budgetPresets.length) {
      return budgetPresets;
    }
    const presets = await apiJson<any[]>("/budgets/presets");
    const mappedPresets = presets.map((preset) => ({
      id: preset.id,
      description: preset.description,
      quantity: preset.quantity,
      unitPrice: preset.unit_price,
      itemType: preset.item_type,
    }));
    setBudgetPresets(mappedPresets);
    return mappedPresets;
  }

  function openBudgetEditor(serviceId: string) {
    setBudgetEditor({ serviceId, kind: "", partName: "", value: "" });
  }

  function updateBudgetEditor(update: Partial<BudgetEditorDraft>) {
    setBudgetEditor((current) => (current ? { ...current, ...update } : current));
  }

  function addBudgetLineFromEditor() {
    if (!budgetEditor || !budgetEditor.kind || budgetEditor.kind === "preset") {
      return;
    }
    const value = parseMoney(budgetEditor.value);
    const description = budgetEditor.kind === "labor" ? "Mao de obra" : budgetEditor.partName.trim();
    if (!description || value <= 0) {
      reportActionError("Informe a descricao e um valor maior que zero para adicionar ao orcamento.");
      return;
    }

    addBudgetLine(budgetEditor.serviceId, {
      id: `line_${Date.now()}`,
      type: budgetEditor.kind,
      description,
      value,
    });
    setBudgetEditor(null);
    setActionError(null);
  }

  function addPresetToBudget(serviceId: string, preset: BudgetPresetDraft) {
    addBudgetLine(serviceId, {
      id: `preset_${preset.id}_${Date.now()}`,
      type: "preset",
      description: preset.description,
      value: preset.unitPrice * preset.quantity,
    });
    setBudgetEditor(null);
  }

  function addBudgetLine(serviceId: string, line: BudgetLineDraft) {
    setBudgetServices((current) => current.map((service) => (
      service.id === serviceId ? { ...service, lines: [...service.lines, line] } : service
    )));
  }

  function removeBudgetLine(serviceId: string, lineId: string) {
    setBudgetServices((current) => current.map((service) => (
      service.id === serviceId ? { ...service, lines: service.lines.filter((line) => line.id !== lineId) } : service
    )));
  }

  function updateServiceTask(taskId: string, update: Partial<ServiceTask>) {
    setServiceTaskDrafts((current) => current.map((task) => (
      task.id === taskId ? { ...task, ...update } : task
    )));
  }

  function mergeServiceTaskDrafts(nextTasks: ServiceTask[]) {
    setServiceTaskDrafts((current) => {
      const preservedTasks = current.length ? current : activeOrder.serviceTasks;
      return nextTasks.map((nextTask) => {
        const preserved = preservedTasks.find((task) => (
          task.id === nextTask.id ||
          (task.budgetItemId && task.budgetItemId === nextTask.budgetItemId) ||
          task.description === nextTask.description
        ));
        return preserved ? { ...nextTask, ...preserved } : nextTask;
      });
    });
  }

  function updatePhotoDraft(taskId: string, value: string) {
    setPhotoDrafts((current) => ({ ...current, [taskId]: value }));
  }

  function addServiceTaskPhoto(taskId: string) {
    const photoReference = photoDrafts[taskId]?.trim();
    if (!photoReference) {
      reportActionError("Informe uma URL ou referencia da foto antes de anexar.");
      return;
    }
    setServiceTaskDrafts((current) => current.map((task) => (
      task.id === taskId ? { ...task, images: [...task.images, photoReference] } : task
    )));
    setPhotoDrafts((current) => ({ ...current, [taskId]: "" }));
    setActionError(null);
  }

  function buildReadyMessageForTasks(tasks: ServiceTask[]) {
    return [
      "*AutoCar - Servico pronto*",
      `Cliente: ${activeOrder.clientName}`,
      `Veiculo: ${activeOrder.vehicleLabel}`,
      "",
      "Etapas executadas:",
      ...(tasks.length ? tasks.map((task) => `- ${task.description}: ${task.status}`) : ["- Aguardando checklist de servico"]),
    ].join("\n");
  }

  async function selectAndAdvance() {
    if (!selectedClientId) {
      throw new Error("Selecione um cliente antes de avancar.");
    }
    await ensureOrder();
    setJourneyStep("diagnosis");
  }

  async function saveDiagnosis() {
    const ensuredOrder = await ensureOrder();
    const diagnosisOrder = mapApiOrder(
      await apiJson<any>(`/service-orders/${ensuredOrder.id}/diagnosis`, {
        method: "POST",
        body: JSON.stringify({
          customer_complaint: complaint || "Cliente nao informou queixa detalhada.",
          mechanic_diagnosis: mechanicDiagnosis || "Diagnostico inicial pendente.",
          diagnostic_tool: diagnosticTool,
          dtc_codes: dtcCodes,
          conclusion: mechanicDiagnosis || complaint || "Diagnostico registrado.",
        }),
      }),
    );
    const servicesAsBudgetItems = diagnosisServices.length
      ? diagnosisServices.map((service) => ({
          id: service.id,
          description: service.name,
          quantity: 1,
          unit_price: 0,
        }))
      : [
          {
            id: `diag_${Date.now()}`,
            description: mechanicDiagnosis || complaint || "Servico diagnosticado",
            quantity: 1,
            unit_price: 0,
          },
        ];
    const nextBudgetServices = servicesAsBudgetItems.map((item) => ({
      id: item.id ?? `diag_${Date.now()}`,
      name: item.description,
      lines: [],
    }));
    const updatedOrder = mapApiOrder(
      await apiJson<any>(`/service-orders/${ensuredOrder.id}`, {
        method: "PUT",
        body: JSON.stringify({
          budget_items: servicesAsBudgetItems,
          stage: "budget",
          status: "Aguardando aprovacao",
        }),
      }),
    );
    setLocalOrder({ ...diagnosisOrder, ...updatedOrder });
    setBudgetServices(nextBudgetServices);
    await reload();
    setJourneyStep("budget");
  }

  async function approveBudget() {
    const ensuredOrder = await ensureOrder();
    const fallbackDescription = mechanicDiagnosis || complaint || "Servico diagnosticado";
    const structuredItems = flattenBudgetServiceItems(budgetServices);
    const updatedOrder = mapApiOrder(
      await apiJson<any>(`/service-orders/${ensuredOrder.id}/approve-budget`, {
        method: "POST",
        body: JSON.stringify({
          budget_id: ensuredOrder.budgetId ?? null,
          items: structuredItems.length ? structuredItems : [{ description: fallbackDescription, quantity: 1, unit_price: 0 }],
        }),
      }),
    );
    setLocalOrder(updatedOrder);
    mergeServiceTaskDrafts(updatedOrder.serviceTasks);
    await reload();
    setJourneyStep("service");
  }

  async function returnToBudgetForExtraService() {
    const description = await promptSystemText("Informe o servico extra", "Servico extra", "Servico extra");
    if (!description) {
      return;
    }
    const extraService: BudgetServiceDraft = {
      id: `extra_${Date.now()}`,
      name: description,
      lines: [],
    };
    setBudgetServices((current) => {
      const baseServices = current.length ? current : buildBudgetServicesFromItems(activeOrder.budgetItems);
      return [...baseServices, extraService];
    });
    setJourneyStep("budget");
  }

  async function completeServices() {
    const ensuredOrder = await ensureOrder();
    const tasks = serviceTaskDrafts.length ? serviceTaskDrafts : ensuredOrder.serviceTasks;
    const hasOpenTasks = tasks.some((task) => task.status !== "Concluido");
    if (hasOpenTasks && !(await confirmSystemAction("Existem servicos ainda nao concluidos. Deseja mesmo prosseguir sem concluir todos os servicos?", "Checklist incompleto"))) {
      return;
    }
    const readyMessageForTasks = buildReadyMessageForTasks(tasks);
    const updatedOrder = mapApiOrder(
      await apiJson<any>(`/service-orders/${ensuredOrder.id}`, {
        method: "PUT",
        body: JSON.stringify({
          service_tasks: tasks.map((task) => ({
            id: task.id,
            budget_item_id: task.budgetItemId ?? null,
            description: task.description,
            status: task.status,
            notes: task.notes,
            images: task.images,
            completed_at: task.completedAt ?? null,
          })),
          stage: "finance",
          status: "Aguardando pagamento",
          ready_message: readyMessageForTasks,
        }),
      }),
    );
    setLocalOrder(updatedOrder);
    setServiceTaskDrafts(updatedOrder.serviceTasks);
    await reload();
    setJourneyStep("finance");
  }

  async function completePayment() {
    const ensuredOrder = await ensureOrder();
    const updatedOrder = mapApiOrder(
      await apiJson<any>(`/service-orders/${ensuredOrder.id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          document_type: paymentDocumentType,
          paid: true,
          payment_method: paymentMethod,
          amount_paid: parseMoney(amountPaid) || total,
        }),
      }),
    );
    setLocalOrder(updatedOrder);
    await reload();
    setJourneyStep("completed");
  }

  const visibleBudgetServices = budgetServices.length ? budgetServices : buildBudgetServicesFromItems(activeOrder.budgetItems);
  const budgetTotal = visibleBudgetServices.reduce((sum, service) => sum + service.lines.reduce((lineSum, line) => lineSum + line.value, 0), 0);
  const total = budgetTotal || activeOrder.budgetItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const budgetWhatsappMessage = [
    "*AutoCar - Orcamento*",
    `Cliente: ${activeOrder.clientName || "Não informado"}`,
    `Veiculo: ${activeOrder.vehicleLabel || "Não informado"}`,
    "",
    "Servicos e itens:",
    ...visibleBudgetServices.flatMap((service) => [
      `*${service.name}*`,
      ...(service.lines.length ? service.lines.map((line) => `- ${line.description}: ${formatCurrency(line.value)}`) : ["- Aguardando itens de mao de obra/pecas"]),
    ]),
    "",
    `Total estimado: ${formatCurrency(total)}`,
    "",
    "Este orçamento fica sujeito a aprovação do cliente antes da execução.",
  ].join("\n");
  const budgetWhatsappUrl = buildWhatsappUrl(activeOrder.clientPhone, budgetWhatsappMessage);
  const budgetPrintHref = activeOrder.budgetId ? `${apiBaseUrl}/documents/orcamento/${activeOrder.budgetId}/download` : emittedFiles.budget;
  const visibleServiceTasks = serviceTaskDrafts.length ? serviceTaskDrafts : activeOrder.serviceTasks;
  const currentDiagnosis: DiagnosisPrintData = {
    complaint: complaint || activeOrder.diagnosis.customerComplaint,
    mechanicDiagnosis: mechanicDiagnosis || activeOrder.diagnosis.mechanicDiagnosis,
    diagnosticTool: diagnosticTool || activeOrder.diagnosis.diagnosticTool,
    dtcCodes: dtcCodes || activeOrder.diagnosis.dtcCodes,
    conclusion: mechanicDiagnosis || complaint || activeOrder.diagnosis.conclusion,
    services: diagnosisServices,
  };
  const diagnosisWhatsappUrl = buildWhatsappUrl(activeOrder.clientPhone, buildDiagnosisMessage(activeOrder, currentDiagnosis));
  const readyMessage = [
    "*AutoCar - Serviço pronto*",
    `Cliente: ${activeOrder.clientName}`,
    `Veiculo: ${activeOrder.vehicleLabel}`,
    "",
    "Etapas executadas:",
    ...(visibleServiceTasks.length
      ? visibleServiceTasks.map((task) => `- ${task.description}: ${task.status}`)
      : ["- Aguardando checklist de servico"]),
  ].join("\n");
  const whatsappUrl = buildWhatsappUrl(activeOrder.clientPhone, readyMessage);

  return (
    <AdminPanelShell
      icon={Wrench}
      title="Jornada do cliente"
      subtitle="Fluxo ponta a ponta: cliente, queixa, diagnostico, orcamento, servico, notificacao e financeiro."
      actionLabel="Nova jornada"
      stats={[
        { label: "Etapa", value: stageLabel(journeyStep) },
        { label: "Cliente", value: activeOrder.clientName || "Selecionar" },
        { label: "Total", value: formatCurrency(total) },
      ]}
    >
      <div className="journey-steps">
        {(["client_selection", "diagnosis", "budget", "service", "finance"] as ServiceOrder["stage"][]).map((step) => (
          <button
            className={journeyStep === step ? "journey-step journey-step-active" : "journey-step"}
            key={step}
            onClick={() => setJourneyStep(step)}
            type="button"
          >
            {stageLabel(step)}
          </button>
        ))}
      </div>

      {journeyStep === "client_selection" ? (
        <PanelSection icon={User} title="Selecao ou cadastro do cliente" description="Ao iniciar atendimento, a jornada sempre comeca pelo cliente.">
          {clientFlow === "choice" ? (
            <div className="journey-choice-grid">
              <button className="journey-choice-card" type="button" onClick={() => setClientFlow("select")}>
                <span className="tool-icon"><Search size={20} /></span>
                <strong>Selecionar cliente</strong>
                <small>Pesquisar por nome, veículo ou placa e iniciar atendimento com histórico visível.</small>
              </button>
              <button className="journey-choice-card" type="button" onClick={() => setClientFlow("create")}>
                <span className="tool-icon"><Plus size={20} /></span>
                <strong>Cadastrar novo cliente</strong>
                <small>Criar cliente com CPF/CNPJ, WhatsApp e um ou mais veiculos vinculados.</small>
              </button>
            </div>
          ) : null}

          {clientFlow === "select" ? (
            <div className="client-selection-flow">
              <div className="panel-top">
                <label className="search-field">
                  <span>Buscar cliente</span>
                  <input
                    aria-label="Buscar cliente"
                    placeholder="Nome, veiculo ou placa"
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                  />
                </label>
                <button className="outline-button" type="button" onClick={() => setClientFlow("create")}>
                  <Plus size={18} />
                  Cadastrar novo cliente
                </button>
              </div>
              <div className="client-selection-table" role="table" aria-label="Tabela de clientes">
                <div className="client-selection-head" role="row">
                  <span>Cliente</span>
                  <span>WhatsApp</span>
                  <span>Veículos</span>
                  <span>Ação</span>
                </div>
                {filteredClients.map((client) => (
                  <div className={selectedClientId === client.id ? "client-selection-row selected" : "client-selection-row"} role="row" key={client.id}>
                    <div>
                      <strong>{client.name}</strong>
                      <small>{client.cpfCnpj || "CPF/CNPJ nao informado"}</small>
                    </div>
                    <span>{client.phone}</span>
                    <div className="vehicle-select-list">
                      {(client.vehicles.length ? client.vehicles : [undefined]).map((vehicle) => (
                        <button
                          className={selectedClientId === client.id && selectedVehicleId === vehicle?.id ? "vehicle-pill active" : "vehicle-pill"}
                          key={vehicle?.id ?? `${client.id}-no-vehicle`}
                          type="button"
                          onClick={() => chooseClient(client, vehicle?.id)}
                        >
                          {vehicle ? `${vehicle.brand} ${vehicle.model} / ${vehicle.plate}` : "Sem veiculo"}
                        </button>
                      ))}
                    </div>
                    <button className="outline-button compact" type="button" onClick={() => chooseClient(client)}>
                      Selecionar
                    </button>
                  </div>
                ))}
                {!filteredClients.length ? <p className="empty-state">Nenhum cliente encontrado para essa busca.</p> : null}
              </div>
              <div className="section-actions">
                <button className="outline-button" type="button" onClick={() => setClientFlow("choice")}>
                  Voltar
                </button>
                <button className="save-button" type="button" onClick={() => void runAction(selectAndAdvance)}>
                  <Save size={18} />
                  Selecionar e avancar
                </button>
              </div>
            </div>
          ) : null}

          {clientFlow === "create" ? (
            <div className="client-create-flow">
              <div className="admin-form-grid two-columns">
                <label>
                  <span>Nome</span>
                  <input aria-label="Novo cliente" placeholder="Nome completo" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} />
                </label>
                <label>
                  <span>WhatsApp</span>
                  <input placeholder="(00) 00000-0000" value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} />
                </label>
                <label>
                  <span>CPF / CNPJ</span>
                  <input aria-label="CPF / CNPJ" placeholder="000.000.000-00" value={newClientCpfCnpj} onChange={(event) => setNewClientCpfCnpj(event.target.value)} />
                </label>
                <label>
                  <span>Email</span>
                  <input placeholder="cliente@email.com" value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} />
                </label>
                <label>
                  <span>Cidade</span>
                  <input placeholder="Cidade / UF" value={newClientCity} onChange={(event) => setNewClientCity(event.target.value)} />
                </label>
              </div>

              <div className="vehicle-form-list">
                {vehicleForms.map((vehicle, index) => (
                  <fieldset className="vehicle-form-card" key={index}>
                    <legend>Veiculo {index + 1}</legend>
                    <div className="admin-form-grid vehicle-grid">
                      <label>
                        <span>Marca</span>
                        <select value={vehicle.brand} onChange={(event) => updateVehicleForm(index, "brand", event.target.value)}>
                          {vehicleBrandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Modelo</span>
                        <input placeholder="Hilux, Amarok, Toro..." value={vehicle.model} onChange={(event) => updateVehicleForm(index, "model", event.target.value)} />
                      </label>
                      <label>
                        <span>Ano</span>
                        <input inputMode="numeric" placeholder="2021" value={vehicle.year} onChange={(event) => updateVehicleForm(index, "year", event.target.value)} />
                      </label>
                      <label>
                        <span>Cor</span>
                        <input placeholder="Prata" value={vehicle.color} onChange={(event) => updateVehicleForm(index, "color", event.target.value)} />
                      </label>
                      <label>
                        <span>Placa</span>
                        <input placeholder="ABC1D23" value={vehicle.plate} onChange={(event) => updateVehicleForm(index, "plate", event.target.value.toUpperCase())} />
                      </label>
                    </div>
                    {vehicleForms.length > 1 ? (
                      <button className="outline-button danger compact" type="button" onClick={() => removeVehicleForm(index)}>
                        Remover veiculo
                      </button>
                    ) : null}
                  </fieldset>
                ))}
                <button className="outline-button blue" type="button" onClick={addVehicleForm}>
                  <Plus size={18} />
                  Adicionar mais um veiculo
                </button>
              </div>

              <div className="section-actions">
                <button className="outline-button" type="button" onClick={() => setClientFlow("choice")}>
                  Voltar
                </button>
                <button className="outline-button green" type="button" onClick={() => void runAction(async () => { await createClientFromForm(); })}>
                  <Plus size={18} />
                  Cadastrar cliente
                </button>
                <button className="save-button" type="button" onClick={() => void runAction(createClientAndAdvance)}>
                  <Save size={18} />
                  Cadastrar e avancar
                </button>
              </div>
            </div>
          ) : null}
          {actionError ? <p className="action-error">{actionError}</p> : null}
        </PanelSection>
      ) : null}

      {journeyStep === "diagnosis" ? (
        <PanelSection icon={ClipboardList} title="Queixa e diagnostico" description="Registre a fala do cliente e o parecer tecnico do mecanico.">
          <div className="admin-form-grid">
            <label>
              <span>Queixa do cliente</span>
              <textarea value={complaint || activeOrder.diagnosis.customerComplaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Cliente relata ruido, falha, vazamento ou comportamento percebido." />
            </label>
            <label>
              <span>Diagnóstico do mecânico</span>
              <textarea value={mechanicDiagnosis || activeOrder.diagnosis.mechanicDiagnosis} onChange={(event) => setMechanicDiagnosis(event.target.value)} placeholder="Inspecao tecnica, testes feitos e conclusao inicial." />
            </label>
            <div className="admin-form-grid two-columns">
              <label>
                <span>Ferramenta usada</span>
                <input value={diagnosticTool} onChange={(event) => setDiagnosticTool(event.target.value)} />
              </label>
              <label>
                <span>DTC / codigo de falha</span>
                <input value={dtcCodes} onChange={(event) => setDtcCodes(event.target.value)} />
              </label>
            </div>
          </div>

          <div className="diagnosis-services-panel">
            <div className="panel-top">
              <div>
                <strong>Servicos identificados</strong>
                <small>Adicione os servicos que devem seguir para o orçamento.</small>
              </div>
              <button className="outline-button blue" type="button" onClick={() => setServiceFormOpen((current) => !current)}>
                <Plus size={18} />
                Criar novo serviço
              </button>
            </div>

            {serviceFormOpen ? (
              <div className="diagnosis-service-form">
                <label>
                  <span>Nome do serviço</span>
                  <input
                    aria-label="Nome do serviço"
                    placeholder="Ex: Troca de pastilhas dianteiras"
                    value={newServiceName}
                    onChange={(event) => setNewServiceName(event.target.value)}
                  />
                </label>
                <button className="save-button square-action" type="button" aria-label="Adicionar serviço " onClick={addDiagnosisService}>
                  <Plus size={20} />
                </button>
              </div>
            ) : null}

            <div className="diagnosis-service-table" role="table" aria-label="Servicos do diagnostico">
              <div className="diagnosis-service-head" role="row">
                <span>Serviço</span>
                <span>Status</span>
                <span>Ação</span>
              </div>
              {diagnosisServices.map((service, index) => (
                <div className="diagnosis-service-row" role="row" key={service.id}>
                  <strong>{service.name}</strong>
                  <span>Selecionado #{index + 1}</span>
                  <button className="outline-button danger compact" type="button" onClick={() => removeDiagnosisService(service.id)}>
                    Remover
                  </button>
                </div>
              ))}
              {!diagnosisServices.length ? (
                <p className="empty-state">Nenhum servico adicionado ainda. Use "Criar novo servico" para montar a lista.</p>
              ) : null}
            </div>
          </div>

          <div className="section-actions">
            <button className="outline-button" type="button" onClick={() => openDiagnosisPrintDocument(activeOrder, currentDiagnosis)}>
              <FileText size={18} />
              Imprimir diagnostico
            </button>
            <a className="outline-button green" href={diagnosisWhatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              Enviar diagnostico
            </a>
            <button className="save-button" type="button" onClick={() => void runAction(saveDiagnosis)}>
              <Save size={18} />
              Avancar para proxima etapa
            </button>
          </div>
          {actionError ? <p className="action-error">{actionError}</p> : null}
        </PanelSection>
      ) : null}

      {journeyStep === "budget" ? (
        <PanelSection icon={DollarSign} title="Orcamento da jornada" description="Itens do orcamento usam o diagnostico como justificativa tecnica.">
          <div className="journey-budget-board">
            {visibleBudgetServices.map((service) => (
              <article className="journey-budget-service" key={service.id}>
                <header>
                  <div>
                    <strong>{service.name}</strong>
                    <small>{service.lines.length ? `${service.lines.length} item(ns) no orcamento` : "Adicione mao de obra, pecas ou predefinicoes"}</small>
                  </div>
                  <button className="outline-button compact" type="button" onClick={() => openBudgetEditor(service.id)}>
                    <Plus size={16} />
                    Adicionar
                  </button>
                </header>

                {budgetEditor?.serviceId === service.id ? (
                  <div className="budget-line-editor">
                    <label>
                      <span>Tipo</span>
                      <select
                        aria-label="Tipo de item do orcamento"
                        value={budgetEditor.kind}
                        onChange={(event) => {
                          const kind = event.target.value as BudgetEditorDraft["kind"];
                          updateBudgetEditor({ kind });
                          if (kind === "preset") {
                            void runAction(async () => { await loadBudgetPresets(); });
                          }
                        }}
                      >
                        <option value="">Selecione</option>
                        <option value="labor">Mao de obra</option>
                        <option value="part">Pecas e componentes</option>
                        <option value="preset">Predefinicoes</option>
                      </select>
                    </label>

                    {budgetEditor.kind === "labor" ? (
                      <label>
                        <span>Valor da mão de obra</span>
                        <input
                          aria-label="Valor da mao de obra"
                          inputMode="decimal"
                          placeholder="R$ 0,00"
                          value={budgetEditor.value}
                          onBlur={(event) => updateBudgetEditor({ value: formatMoneyInput(event.target.value) })}
                          onChange={(event) => updateBudgetEditor({ value: event.target.value })}
                        />
                      </label>
                    ) : null}

                    {budgetEditor.kind === "part" ? (
                      <>
                        <label>
                          <span>Nome da peça</span>
                          <input
                            aria-label="Nome da peça"
                            placeholder="Ex: Pastilha dianteira"
                            value={budgetEditor.partName}
                            onChange={(event) => updateBudgetEditor({ partName: event.target.value })}
                          />
                        </label>
                        <label>
                          <span>Valor da peça</span>
                          <input
                            aria-label="Valor da peça"
                            inputMode="decimal"
                            placeholder="R$ 0,00"
                            value={budgetEditor.value}
                            onBlur={(event) => updateBudgetEditor({ value: formatMoneyInput(event.target.value) })}
                            onChange={(event) => updateBudgetEditor({ value: event.target.value })}
                          />
                        </label>
                      </>
                    ) : null}

                    {budgetEditor.kind === "preset" ? (
                      <div className="budget-preset-list">
                        {budgetPresets.map((preset) => (
                          <button className="vehicle-pill" type="button" key={preset.id} onClick={() => addPresetToBudget(service.id, preset)}>
                            {preset.description} / {formatCurrency(preset.unitPrice * preset.quantity)}
                          </button>
                        ))}
                        {!budgetPresets.length ? <small>Carregando predefinicoes...</small> : null}
                      </div>
                    ) : null}

                    {budgetEditor.kind && budgetEditor.kind !== "preset" ? (
                      <button className="save-button square-action" type="button" aria-label="Adicionar item ao orcamento" onClick={addBudgetLineFromEditor}>
                        <Plus size={20} />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="budget-line-table" role="table" aria-label={`Itens do orcamento ${service.name}`}>
                  {service.lines.map((line) => (
                    <div className="budget-line-row" role="row" key={line.id}>
                      <span>{line.type === "labor" ? "Mao de obra" : line.type === "part" ? "Peca" : "Predefinicao"}</span>
                      <strong>{line.description}</strong>
                      <b>{formatCurrency(line.value)}</b>
                      <button className="outline-button danger compact" type="button" onClick={() => removeBudgetLine(service.id, line.id)}>
                        Remover
                      </button>
                    </div>
                  ))}
                  {!service.lines.length ? <p className="empty-state">Nenhum valor adicionado para este servico.</p> : null}
                </div>
              </article>
            ))}

            <article className="journey-budget-total">
              <span>Total do orçamento</span>
              <strong>{formatCurrency(total)}</strong>
            </article>
          </div>

          <div className="section-actions">
            <a className="outline-button green" href={budgetWhatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <a className="outline-button blue" href={budgetPrintHref} target="_blank" rel="noreferrer">
              <FileText size={18} />
              Imprimir orcamento
            </a>
            <button className="save-button" type="button" onClick={() => void runAction(approveBudget)}>
              <CheckCircle2 size={18} />
              Orcamento aprovado
            </button>
          </div>
          {actionError ? <p className="action-error">{actionError}</p> : null}
        </PanelSection>
      ) : null}

      {journeyStep === "service" ? (
        <PanelSection icon={Wrench} title="Checklist de servicos" description="Cada item aprovado vira uma etapa de execucao com status, fotos e notas.">
          <div className="service-checklist-board">
            {visibleServiceTasks.map((task, index) => (
              <article key={task.id} className={task.status === "Concluido" ? "service-task-card task-done" : "service-task-card"}>
                <header>
                  <div>
                    <strong>{task.description}</strong>
                    <small>Servico {index + 1} / {task.images.length} foto(s)</small>
                  </div>
                  <StatusPill status={task.status} />
                </header>
                <div className="service-task-grid">
                  <label>
                    <span>Status</span>
                    <select
                      aria-label={`Status do servico ${task.description}`}
                      value={task.status}
                      onChange={(event) => updateServiceTask(task.id, { status: event.target.value as ServiceTask["status"] })}
                    >
                      {serviceStatusOptions.map((status) => (
                        <option key={status} value={status}>{serviceStatusLabel(status)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Comentários</span>
                    <textarea
                      aria-label={`Comentarios do servico ${task.description}`}
                      placeholder="Descreva o que foi feito, pendencias e evidencias."
                      value={task.notes}
                      onChange={(event) => updateServiceTask(task.id, { notes: event.target.value })}
                    />
                  </label>
                </div>
                <div className="service-photo-row">
                  <label>
                    <span>Foto do serviço</span>
                    <input
                      aria-label={`Foto do servico ${task.description}`}
                      placeholder="URL ou referencia da foto"
                      value={photoDrafts[task.id] ?? ""}
                      onChange={(event) => updatePhotoDraft(task.id, event.target.value)}
                    />
                  </label>
                  <button className="outline-button blue compact" type="button" onClick={() => addServiceTaskPhoto(task.id)}>
                    <Image size={16} />
                    Adicionar foto
                  </button>
                </div>
                {task.images.length ? (
                  <div className="service-photo-list">
                    {task.images.map((imageRef) => <span key={imageRef}>{imageRef}</span>)}
                  </div>
                ) : null}
              </article>
            ))}
            {!visibleServiceTasks.length ? <p className="empty-state">Nenhum servico aprovado ainda.</p> : null}
          </div>
          <div className="section-actions">
            <button className="outline-button" type="button" onClick={returnToBudgetForExtraService}>
              <Plus size={18} />
              Servico extra
            </button>
            <button className="save-button" type="button" onClick={() => void runAction(completeServices)}>
              <CheckCircle2 size={18} />
              Avancar para pagamento
            </button>
          </div>
          {actionError ? <p className="action-error">{actionError}</p> : null}
        </PanelSection>
      ) : null}

      {journeyStep === "notification" ? (
        <PanelSection icon={MessageCircle} title="Notificar cliente" description="Mensagem estruturada avisa que o veiculo esta pronto e lista as etapas.">
          <div className="export-preview">
            <span>WhatsApp</span>
            <pre>{readyMessage}</pre>
          </div>
          <div className="section-actions">
            <a className="outline-button green" href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              Abrir WhatsApp
            </a>
            <button className="outline-button" type="button">Emitir recibo</button>
            <button className="outline-button" type="button">Emitir NF</button>
          </div>
          <button className="save-button" type="button" onClick={() => setJourneyStep("finance")}>
            <DollarSign size={18} />
            Registrar pagamento
          </button>
        </PanelSection>
      ) : null}

      {journeyStep === "finance" ? (
        <PanelSection icon={ReceiptText} title="Pagamento da jornada" description="Registre valor pago, metodo, documento e conclua o servico.">
          <div className="admin-form-grid two-columns">
            <label>
              <span>Documento</span>
              <select value={paymentDocumentType} onChange={(event) => setPaymentDocumentType(event.target.value as "NF" | "Recibo")}>
                <option value="Recibo">Recibo</option>
                <option value="NF">Nota fiscal</option>
              </select>
            </label>
            <label>
              <span>Método de pagamento</span>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {paymentMethodOptions.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Valor pago</span>
              <input
                value={amountPaid || formatCurrency(activeOrder.payment.amountPaid || total)}
                onBlur={(event) => setAmountPaid(formatMoneyInput(event.target.value))}
                onChange={(event) => setAmountPaid(event.target.value)}
              />
            </label>
            <label>
              <span>Status fiscal</span>
              <input readOnly value={paymentDocumentType === "NF" ? "Emissao fiscal preparada para provedor futuro" : "Recibo interno preparado"} />
            </label>
          </div>
          <button className="save-button" type="button" onClick={() => void runAction(completePayment)}>
            <CheckCircle2 size={18} />
            Concluir servico
          </button>
          {actionError ? <p className="action-error">{actionError}</p> : null}
        </PanelSection>
      ) : null}
    </AdminPanelShell>
  );
}

function BudgetLibraryWorkspace({ budgets }: { budgets: Budget[] }) {
  const { reload } = useAppData();
  const [selectedBudgetId, setSelectedBudgetId] = useState(budgets[0]?.id ?? "");
  const [presets, setPresets] = useState<BudgetPresetDraft[]>([]);
  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetValue, setPresetValue] = useState("");
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const selectedBudget = budgets.find((item) => item.id === selectedBudgetId) ?? budgets[0];
  const selectedBudgetTotal = selectedBudget
    ? selectedBudget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + selectedBudget.laborValue
    : 0;

  async function loadPresets() {
    try {
      const loadedPresets = await apiJson<any[]>("/budgets/presets");
      const mappedPresets = loadedPresets.map((preset) => ({
        id: preset.id,
        description: preset.description,
        quantity: preset.quantity,
        unitPrice: preset.unit_price,
        itemType: preset.item_type,
      }));
      setPresets(mappedPresets);
      return mappedPresets;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar predefinicoes.";
      setPresetMessage(message);
      await showSystemError(message);
      return [];
    }
  }

  async function createPreset(description: string, value: number) {
    if (!description.trim()) {
      const message = "Informe o nome da predefinicao.";
      setPresetMessage(message);
      await showSystemError(message);
      return;
    }
    try {
      const createdPreset = await apiJson<any>("/budgets/presets", {
        method: "POST",
        body: JSON.stringify({
          description: description.trim(),
          quantity: 1,
          unit_price: value,
          item_type: "Servico",
          notes: "",
        }),
      });
      setPresets((current) => [
        {
          id: createdPreset.id,
          description: createdPreset.description,
          quantity: createdPreset.quantity,
          unitPrice: createdPreset.unit_price,
          itemType: createdPreset.item_type,
        },
        ...current,
      ]);
      setPresetName("");
      setPresetValue("");
      setPresetFormOpen(false);
      setPresetMessage("Predefinicao criada.");
      await reload();
      await showSystemSuccess("Predefinicao criada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar predefinicao.";
      setPresetMessage(message);
      await showSystemError(message);
    }
  }

  async function createPresetFromBudgetItem(item: Budget["items"][number]) {
    await createPreset(item.description, item.unitPrice);
  }

  return (
    <AdminPanelShell
      icon={ClipboardList}
      title="Orcamentos"
      subtitle="Consulta de orcamentos feitos e biblioteca de predefinicoes para a jornada do cliente."
      actionLabel="Nova predefinicao"
      stats={[
        { label: "Orcamentos", value: String(budgets.length) },
        { label: "Selecionado", value: selectedBudget ? formatCurrency(selectedBudgetTotal) : "Nenhum" },
        { label: "Predefinicoes", value: String(presets.length) },
      ]}
    >
      <PanelSection icon={Eye} title="Orcamentos realizados" description="Lista de orcamentos ja gerados pela jornada do cliente.">
        <div className="budget-history-layout">
          <div className="admin-data-list budget-history-list">
            {budgets.map((budget) => {
              const budgetTotal = budget.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + budget.laborValue;
              return (
                <button
                  className={selectedBudget?.id === budget.id ? "admin-data-row admin-data-button highlighted" : "admin-data-row admin-data-button"}
                  key={budget.id}
                  type="button"
                  onClick={() => setSelectedBudgetId(budget.id)}
                >
                  <div>
                    <strong>{budget.clientName}</strong>
                    <span>{budget.vehicleLabel} / {budget.status}</span>
                  </div>
                  <b>{formatCurrency(budgetTotal)}</b>
                </button>
              );
            })}
            {!budgets.length ? (
              <article className="admin-data-row">
                <div>
                  <strong>Nenhum orcamento encontrado</strong>
                  <span>Os orcamentos criados na jornada aparecem aqui.</span>
                </div>
              </article>
            ) : null}
          </div>

          <div className="budget-detail-panel">
            <header>
              <div>
                <strong>{selectedBudget?.clientName ?? "Selecione um orcamento"}</strong>
                <span>{selectedBudget?.vehicleLabel ?? "Veja os itens para transformar em predefinicoes."}</span>
              </div>
              <b>{formatCurrency(selectedBudgetTotal)}</b>
            </header>
            <div className="budget-item-list">
              {(selectedBudget?.items ?? []).map((item) => (
                <article className="budget-preset-source" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                  </div>
                  <button className="outline-button compact" type="button" onClick={() => void createPresetFromBudgetItem(item)}>
                    <Plus size={16} />
                    Adicionar como predefinicao
                  </button>
                </article>
              ))}
              {selectedBudget?.laborValue ? (
                <article className="budget-preset-source">
                  <div>
                    <strong>Mao de obra</strong>
                    <span>{formatCurrency(selectedBudget.laborValue)}</span>
                  </div>
                  <button className="outline-button compact" type="button" onClick={() => void createPreset("Mao de obra", selectedBudget.laborValue)}>
                    <Plus size={16} />
                    Adicionar como predefinicao
                  </button>
                </article>
              ) : null}
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection icon={FilePlus2} title="Predefinicoes de orcamento" description="Servicos reutilizaveis que aparecem quando a jornada pede uma predefinicao.">
        <div className="panel-top">
          <div>
            <strong>Biblioteca de predefinicoes</strong>
            <small>Use itens antigos ou cadastre um item manualmente.</small>
          </div>
          <button className="outline-button blue" type="button" onClick={() => {
            setPresetFormOpen(true);
            void loadPresets();
          }}>
            <Plus size={18} />
            Criar nova predefinicao
          </button>
        </div>

        {presetFormOpen ? (
          <div className="inline-modal">
            <header>
              <strong>Nova predefinicao</strong>
              <button type="button" onClick={() => setPresetFormOpen(false)}>Fechar</button>
            </header>
            <div className="admin-form-grid two-columns">
              <label>
                <span>Nome do componente</span>
                <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Ex: Pastilha dianteira" />
              </label>
              <label>
                <span>Valor</span>
                <input
                  inputMode="decimal"
                  value={presetValue}
                  onBlur={(event) => setPresetValue(formatMoneyInput(event.target.value))}
                  onChange={(event) => setPresetValue(event.target.value)}
                  placeholder="R$ 0,00"
                />
              </label>
            </div>
            <button className="save-button" type="button" onClick={() => void createPreset(presetName, parseMoney(presetValue))}>
              <Save size={18} />
              Salvar predefinicao
            </button>
          </div>
        ) : null}

        <div className="admin-data-list">
          {presets.map((preset) => (
            <article className="admin-data-row" key={preset.id}>
              <div>
                <strong>{preset.description}</strong>
                <span>{preset.itemType} / qtd. {preset.quantity}</span>
              </div>
              <b>{formatCurrency(preset.unitPrice * preset.quantity)}</b>
            </article>
          ))}
          {!presets.length ? (
            <article className="admin-data-row">
              <div>
                <strong>Predefinicoes ainda nao carregadas</strong>
                <span>Clique em criar nova predefinicao para carregar a biblioteca.</span>
              </div>
            </article>
          ) : null}
        </div>
        {presetMessage ? <p className="action-error">{presetMessage}</p> : null}
      </PanelSection>
    </AdminPanelShell>
  );
}

function BudgetWorkspace({ budget, clients }: { budget?: Budget; clients: Client[] }) {
  const selectedClient = clients[0];
  const total =
    (budget?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ?? 0) +
    (budget?.laborValue ?? 0);
  const previewText = budget ? buildBudgetWhatsappPreview(budget) : "";
  const whatsappHref = buildWhatsappUrl(selectedClient?.phone ?? "", previewText);
  const budgetDocxHref = budget ? `${apiBaseUrl}/documents/orcamento/${budget.id}/download` : emittedFiles.budget;

  return (
    <AdminPanelShell
      icon={ClipboardList}
      title="Orçamentos"
      subtitle="Cadastro de proposta, visualização dos valores e provas de transparência antes da aprovação."
      actionLabel="Novo orçamento"
      stats={[
        { label: "Status", value: budget?.status ?? "Rascunho" },
        { label: "Total aberto", value: formatCurrency(total) },
        { label: "Saídas", value: "WhatsApp + PDF" },
      ]}
    >
      <PanelSection icon={Plus} title="Cadastro" description="Cliente, veiculo, itens, pecas, mao de obra e observacoes comerciais.">
        <div className="admin-form-grid">
          <label>
            <span>Cliente vinculado</span>
            <select value={selectedClient?.id ?? ""} onChange={() => undefined}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.vehicles[0]?.model ?? "sem veiculo"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Veículo</span>
            <input readOnly value={budget?.vehicleLabel ?? selectedClient?.vehicles[0]?.model ?? ""} />
          </label>
          <label>
            <span>Observação transparente</span>
            <textarea defaultValue={budget?.notes ?? "Informe prazo, garantias e condicoes de aprovacao."} />
          </label>
        </div>

        <div className="budget-item-table compact-budget-table">
          <div className="budget-head">
            <span>Item / servico</span>
            <span>Tipo</span>
            <span>Qtd.</span>
            <span>Valor unit.</span>
            <span>Desconto</span>
            <span>Total</span>
            <span />
          </div>
          <div className="budget-line">
            <textarea defaultValue={budget?.items[0]?.description ?? "Troca de oleo do motor"} />
            <div className="segmented">
              <button className="segment-active">Servico</button>
              <button>Peca</button>
            </div>
            <input defaultValue={String(budget?.items[0]?.quantity ?? 1)} />
            <input defaultValue={formatCurrency(budget?.items[0]?.unitPrice ?? 0)} />
            <input defaultValue={formatCurrency(0)} />
            <strong>{formatCurrency((budget?.items[0]?.unitPrice ?? 0) + (budget?.laborValue ?? 0))}</strong>
            <button className="danger-icon" title="Remover item" aria-label="Remover item">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="section-actions">
          <button className="wide-add-button">
            <Plus size={18} />
            Adicionar item
          </button>
          <button className="outline-button blue">
            <FileImage size={18} />
            Evidencia
          </button>
          <button className="outline-button green">
            <FilePlus2 size={18} />
            Templates
          </button>
        </div>
      </PanelSection>

      <PanelSection icon={Eye} title="Visualizacao dos dados" description="Composicao do preco visivel antes da aprovacao do cliente.">
        <div className="admin-data-list">
          {(budget?.items ?? []).map((item) => (
            <article key={item.id} className="admin-data-row">
              <div>
                <strong>{item.description}</strong>
                <span>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </span>
              </div>
              <b>{formatCurrency(item.quantity * item.unitPrice)}</b>
            </article>
          ))}
          <article className="admin-data-row highlighted">
            <div>
              <strong>Mão de obra</strong>
            </div>
            <b>{formatCurrency(budget?.laborValue ?? 0)}</b>
          </article>
        </div>
      </PanelSection>

      <PanelSection icon={ShieldCheck} title="Ferramentas de transparencia" description="Exportacao estruturada e comunicacao rastreavel.">
        <ToolGrid
          tools={[
            { icon: MessageCircle, label: "Abrir WhatsApp", description: "Mensagem clara com itens e total", href: whatsappHref, external: true, preview: previewText },
            { icon: Download, label: "Baixar orcamento", description: "DOCX preenchido pela API", href: budgetDocxHref },
            { icon: CalendarClock, label: "Recorrencia", description: "Orcamento preventivo por cliente" },
          ]}
        />
      </PanelSection>

      <button className="save-button">
        <Save size={20} />
        Salvar orcamento
      </button>
    </AdminPanelShell>
  );
}

function ClientsWorkspace({ clients, serviceOrders }: { clients: Client[]; serviceOrders: ServiceOrder[] }) {
  const vehicles = clients.flatMap((client) => client.vehicles);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);
  const historyClient = clients.find((client) => client.id === historyClientId);
  const clientHistory = serviceOrders.filter((order) => order.clientId === historyClientId || order.clientName === historyClient?.name);

  return (
    <AdminPanelShell
      icon={User}
      title="Clientes"
      subtitle="Cadastro unico de cliente e veiculos, com historico acessivel para atendimento transparente."
      actionLabel="Novo cliente"
      stats={[
        { label: "Clientes", value: String(clients.length) },
        { label: "Veiculos", value: String(vehicles.length) },
        { label: "Historico", value: formatCurrency(clients.reduce((sum, client) => sum + client.lifetimeValue, 0)) },
      ]}
    >
      {false ? (
      <PanelSection icon={Plus} title="Cadastro" description="Dados de contato, responsavel, veiculos e dados usados nos demais modulos.">
        <div className="admin-form-grid two-columns">
          <label>
            <span>Nome do cliente</span>
            <input defaultValue={clients[0]?.name ?? ""} />
          </label>
          <label>
            <span>WhatsApp</span>
            <input defaultValue={clients[0]?.phone ?? ""} />
          </label>
          <label>
            <span>Placa</span>
            <input defaultValue={clients[0]?.vehicles[0]?.plate ?? ""} />
          </label>
          <label>
            <span>Veículo</span>
            <input defaultValue={clients[0]?.vehicles[0]?.model ?? ""} />
          </label>
        </div>
      </PanelSection>
      ) : null}

      <PanelSection icon={Eye} title="Visualizacao dos dados" description="Consulta por cliente, placa, status de revisao e valor historico.">
        <div className="client-admin-grid">
          {clients.map((client) => (
            <article className="client-card" key={client.id}>
              <div>
                <strong>{client.name}</strong>
                <span>{client.phone}</span>
              </div>
              <small>
                {client.city} - ultima visita: {formatDate(client.lastVisit)}
              </small>
              <div className="vehicle-strip">
                {client.vehicles.map((vehicle) => (
                  <span key={vehicle.id}>
                    {vehicle.plate} / {vehicle.model} / {vehicle.status}
                  </span>
                ))}
              </div>
              <button className="outline-button" type="button" onClick={() => setHistoryClientId(client.id)}>
                <History size={16} />
                Servicos executados
              </button>
            </article>
          ))}
        </div>
        {historyClient ? (
          <div className="inline-modal">
            <header>
              <strong>Historico de {historyClient.name}</strong>
              <button type="button" onClick={() => setHistoryClientId(null)}>Fechar</button>
            </header>
            <div className="admin-data-list">
              {clientHistory.length ? (
                clientHistory.map((order) => (
                  <article className="admin-data-row" key={order.id}>
                    <div>
                      <strong>{order.vehicleLabel}</strong>
                      <span>{stageLabel(order.stage)} / {order.status}</span>
                    </div>
                    <b>{formatDate(order.createdAt)}</b>
                  </article>
                ))
              ) : (
                <article className="admin-data-row">
                  <div>
                    <strong>Nenhum serviço encontrado</strong>
                    <span>Quando o serviço for criado, ele aparece aqui.</span>
                  </div>
                </article>
              )}
            </div>
          </div>
        ) : null}
      </PanelSection>

      <PanelSection icon={ShieldCheck} title="Ferramentas de transparencia" description="Mostra claramente o que existe no cadastro e quais atendimentos estao vinculados.">
        <ToolGrid
          tools={[
            { icon: Search, label: "Busca por placa", description: "Acesso rapido ao historico do veiculo" },
            { icon: History, label: "Linha do tempo", description: "Servicos, orcamentos e pagamentos vinculados" },
            { icon: Share2, label: "Resumo do cliente", description: "Compartilhavel por WhatsApp" },
          ]}
        />
      </PanelSection>
    </AdminPanelShell>
  );
}

function ServiceWorkspace({ report }: { report?: ServiceReport }) {
  const reportDocxHref = report ? `${apiBaseUrl}/documents/relatorio/${report.id}/download` : emittedFiles.report;

  return (
    <AdminPanelShell
      icon={Wrench}
      title="Servicos"
      subtitle="Checklist tecnico com notas, fotos e relatorio final para o cliente acompanhar o que foi feito."
      actionLabel="Iniciar servico"
      stats={[
        { label: "OS", value: report?.title ?? "--" },
        { label: "Status", value: report?.status ?? "Em execucao" },
        { label: "Evidencias", value: String(report?.images.length ?? 0) },
      ]}
    >
      <PanelSection icon={Plus} title="Cadastro" description="Abra uma ordem de servico com responsavel tecnico, checklist, notas e anexos.">
        <div className="service-focus">
          <div>
            <span>{report?.title ?? "OS"}</span>
            <h2>{report?.vehicleLabel ?? "Servico sem veiculo"}</h2>
            <p>{report?.clientName ?? "Cliente nao selecionado"}</p>
          </div>
          <StatusPill status={report?.status ?? "Em execucao"} />
        </div>
        <div className="admin-form-grid">
          <label>
            <span>Nota técnica</span>
            <textarea defaultValue={report?.notes[0] ?? "Descreva sintomas, diagnostico e autorizacoes do cliente."} />
          </label>
        </div>
      </PanelSection>

      <PanelSection icon={Eye} title="Visualizacao dos dados" description="Checklist visual para provar etapa, pendencia e conclusao.">
        <div className="checklist-board">
          {(report?.checklist ?? []).map((item) => (
            <label key={item.id} className={item.done ? "check-row check-row-done" : "check-row"}>
              <input type="checkbox" defaultChecked={item.done} />
              <span>{item.label}</span>
              <small>{item.notes ?? (item.done ? "Concluido" : "Pendente")}</small>
            </label>
          ))}
        </div>
      </PanelSection>

      <PanelSection icon={ShieldCheck} title="Ferramentas de transparencia" description="Relatorio com evidencias reduz contestacao e aumenta confianca no servico.">
        <ToolGrid
          tools={[
            { icon: Image, label: "Anexar fotos", description: "Antes, durante e depois do reparo" },
            { icon: CheckCircle2, label: "Checklist auditavel", description: "Etapas tecnicas assinaveis" },
            { icon: FileText, label: "Preview relatorio", description: "Resumo tecnico estruturado", preview: report ? buildServiceReportSummary(report) : "" },
            { icon: Download, label: "Baixar relatorio", description: "DOCX preenchido pela API", href: reportDocxHref },
          ]}
        />
      </PanelSection>
    </AdminPanelShell>
  );
}

function AlertsWorkspace({ reminders }: { reminders: Reminder[] }) {
  return (
    <AdminPanelShell
      icon={Bell}
      title="Lembretes"
      subtitle="Agenda por cliente para retornos preventivos, cobrancas e recorrencias com registro de contato."
      actionLabel="Novo lembrete"
      stats={[
        { label: "Ativos", value: String(reminders.length) },
        { label: "Canal", value: "WhatsApp" },
        { label: "Recorrencia", value: "Mensal+" },
      ]}
    >
      <PanelSection icon={Plus} title="Cadastro" description="Configure cliente, data, hora, canal e recorrencia do contato.">
        <div className="admin-form-grid two-columns">
          <label>
            <span>Cliente</span>
            <input defaultValue={reminders[0]?.clientName ?? ""} />
          </label>
          <label>
            <span>Canal</span>
            <select defaultValue={reminders[0]?.channel ?? "WhatsApp"}>
              <option>WhatsApp</option>
              <option>Ligação</option>
              <option>Email</option>
            </select>
          </label>
          <label>
            <span>Data e hora</span>
            <input defaultValue={reminders[0] ? formatDateTime(reminders[0].dueAt) : ""} />
          </label>
          <label>
            <span>Recorrência</span>
            <select defaultValue={reminders[0]?.recurrence ?? "Unico"}>
              <option>Unico</option>
              <option>Semanal</option>
              <option>Mensal</option>
              <option>Trimestral</option>
              <option>Anual</option>
            </select>
          </label>
        </div>
      </PanelSection>

      <PanelSection icon={Eye} title="Visualizacao dos dados" description="Fila organizada por vencimento, cliente e status.">
        <div className="alert-admin-list">
          {reminders.map((reminder) => (
            <article key={reminder.id}>
              <div>
                <strong>{reminder.title}</strong>
                <span>
                  {reminder.clientName} / {reminder.channel}
                </span>
              </div>
              <small>{formatDateTime(reminder.dueAt)}</small>
              <StatusPill status={reminder.status} />
            </article>
          ))}
        </div>
      </PanelSection>

      <PanelSection icon={ShieldCheck} title="Ferramentas de transparencia" description="Todo contato pode virar evidencia de relacionamento, prazo e autorizacao.">
        <ToolGrid
          tools={[
            { icon: MessageCircle, label: "Enviar WhatsApp", description: "Mensagem com contexto do cliente" },
            { icon: Repeat, label: "Recorrencia", description: "Preventiva mensal, trimestral ou anual" },
            { icon: Clock3, label: "Registro de contato", description: "Historico de tentativas e retornos" },
          ]}
        />
      </PanelSection>
    </AdminPanelShell>
  );
}

function FinanceWorkspace({ entries }: { entries: FinancialEntry[] }) {
  const revenue = entries.filter((entry) => entry.type === "Receita").reduce((sum, entry) => sum + entry.amount, 0);
  const costs = entries.filter((entry) => entry.type === "Custo").reduce((sum, entry) => sum + entry.amount, 0);
  const latestEntry = entries[0];
  const nfeDocxHref = latestEntry ? `${apiBaseUrl}/documents/nfe/${latestEntry.id}/download` : emittedFiles.nfe;

  return (
    <AdminPanelShell
      icon={DollarSign}
      title="Financeiro"
      subtitle="Notas, recibos, custos, receitas e demonstrativos por periodo com rastreio documental."
      actionLabel="Novo recibo"
      stats={[
        { label: "Receita", value: formatCurrency(revenue) },
        { label: "Custos", value: formatCurrency(costs) },
        { label: "Resultado", value: formatCurrency(revenue - costs) },
      ]}
    >
      <PanelSection icon={Plus} title="Cadastro" description="Registre NF, recibo, despesa, categoria, valor, data e status financeiro.">
        <div className="finance-kpis">
          <KpiCard label="Receita" value={formatCurrency(revenue)} />
          <KpiCard label="Custos" value={formatCurrency(costs)} />
          <KpiCard label="Resultado" value={formatCurrency(revenue - costs)} />
        </div>
        <div className="admin-form-grid two-columns">
          <label>
            <span>Documento</span>
            <select defaultValue="Recibo">
              <option>Nota Fiscal</option>
              <option>Recibo</option>
              <option>Despesa</option>
            </select>
          </label>
          <label>
            <span>Valor</span>
            <input defaultValue={formatCurrency(entries[0]?.amount ?? 0)} />
          </label>
        </div>
      </PanelSection>

      <PanelSection icon={Eye} title="Visualizacao dos dados" description="Balanco com origem, documento e status para auditoria simples.">
        <div className="finance-list">
          {entries.map((entry) => (
            <article key={entry.id}>
              <span>{entry.documentType}</span>
              <strong>{entry.description}</strong>
              <small>{formatDate(entry.issuedAt)}</small>
              <b>{formatCurrency(entry.amount)}</b>
            </article>
          ))}
        </div>
      </PanelSection>

      <PanelSection icon={ShieldCheck} title="Ferramentas de transparencia" description="Documentos fiscais e resumos por periodo deixam a relacao financeira verificavel.">
        <ToolGrid
          tools={[
            { icon: ReceiptText, label: "Emitir NF", description: "DOCX interno, fiscal disabled", href: nfeDocxHref },
            { icon: FileText, label: "Recibo", description: "Comprovante estruturado por OS" },
            { icon: BarChart3, label: "Resumo 5 anos", description: "Mensal, trimestral e anual" },
          ]}
        />
      </PanelSection>
    </AdminPanelShell>
  );
}

function NotificationsCard({ reminders, onViewAll }: { reminders: Reminder[]; onViewAll: () => void }) {
  return (
    <article className="notifications-card">
      <header>
        <div>
          <Bell size={20} />
          <strong>Notificacoes</strong>
        </div>
        <button onClick={onViewAll}>Ver todas</button>
      </header>
      <div className="notification-list">
        {reminders.map((reminder, index) => (
          <div className="notification-item" key={reminder.id}>
            <span className="notification-icon">
              {index === 0 ? <Gauge size={24} /> : index === 1 ? <BriefcaseBusiness size={24} /> : <CalendarClock size={24} />}
            </span>
            <div>
              <strong>{reminder.title}</strong>
              <small>Cliente: {reminder.clientName}</small>
              <small>Vencimento: {formatDate(reminder.dueAt)}</small>
            </div>
            <button className="whatsapp-button" title="Enviar WhatsApp" aria-label="Enviar WhatsApp">
              <MessageCircle size={22} />
            </button>
          </div>
        ))}
      </div>
      <footer>
        <Bell size={16} />
        {reminders.length} novas notificacoes
      </footer>
    </article>
  );
}

function ImageShortcut({
  active,
  ariaLabel,
  image,
  onClick,
}: {
  active: boolean;
  ariaLabel: string;
  image: string;
  onClick: () => void;
}) {
  return (
    <button aria-label={ariaLabel} className={active ? "image-shortcut image-shortcut-active" : "image-shortcut"} onClick={onClick}>
      <img src={asset(image)} alt="" />
    </button>
  );
}

function ActiveServicesTable({
  onSelectOrder,
  orders,
  reports,
}: {
  onSelectOrder: (orderId: string) => void;
  orders: ServiceOrder[];
  reports: ServiceReport[];
}) {
  const orderRows = orders
    .filter((order) => order.stage !== "completed" && order.status !== "Concluida")
    .map((order) => ({
      id: order.id,
      source: "order" as const,
      vehicleLabel: order.vehicleLabel,
      clientName: order.clientName,
      mechanic: stageLabel(order.stage),
      status: order.status,
      checkInAt: order.createdAt,
    }));
  const reportRows = reports.map((report) => ({
    id: report.id,
    source: "report" as const,
    vehicleLabel: report.vehicleLabel,
    clientName: report.clientName,
    mechanic: report.mechanic,
    status: report.status,
    checkInAt: report.checkInAt,
  }));
  const rows = orderRows.length ? orderRows : reportRows;

  return (
    <section className="active-services">
      <header>
        <div>
          <Wrench size={26} />
          <h2>
            Servicos <span>Ativos</span>
          </h2>
        </div>
      </header>
      <div className="services-table">
        <div className="services-head">
          <span>
            <Car size={18} /> Veículo
          </span>
          <span>
            <User size={18} /> Dono
          </span>
          <span>
            <Wrench size={18} /> Etapa
          </span>
          <span>Status</span>
        </div>
        <div className="services-body">
          {rows.map((report) => (
            <button
              aria-label={`Abrir servico ativo ${report.clientName} ${report.vehicleLabel}`}
              className="services-row services-row-button"
              key={report.id}
              type="button"
              onClick={() => {
                if (report.source === "order") {
                  onSelectOrder(report.id);
                }
              }}
            >
              <div>
                <LogoChip label={report.vehicleLabel} />
                <span>
                  {report.vehicleLabel}
                  <small>{new Date(report.checkInAt).getFullYear() || 2026}</small>
                </span>
              </div>
              <span>{report.clientName}</span>
              <span className="stage-cell">
                <Wrench size={18} />
                {report.mechanic}
              </span>
              <StatusPill status={report.status} />
            </button>
          ))}
        </div>
      </div>
      <footer className="active-services-footer" aria-hidden="true" />
    </section>
  );
}

function AdminPanelShell({
  children,
  icon: Icon,
  title,
}: {
  actionLabel: string;
  children: ReactNode;
  icon: LucideIcon;
  stats: PanelStat[];
  subtitle: string;
  title: string;
}) {
  return (
    <section className="admin-panel structured-admin-panel">
      <header className="admin-panel-heading">
        <BlockTitle icon={Icon} title={title} />
      </header>

      {children}
    </section>
  );
}

function PanelSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <BlockTitle icon={Icon} title={title} />
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

function ToolGrid({ tools }: { tools: ToolItem[] }) {
  return (
    <div className="admin-tool-grid">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const content = (
          <>
            <span className="tool-icon">
              <Icon size={20} />
            </span>
            <div>
              <strong>{tool.label}</strong>
              <small>{tool.description}</small>
            </div>
          </>
        );

        return (
          <article className="admin-tool-card" key={tool.label}>
            {tool.href ? (
              <a href={tool.href} download={!tool.external} target={tool.external ? "_blank" : undefined} rel={tool.external ? "noreferrer" : undefined}>
                {content}
              </a>
            ) : (
              <button type="button">{content}</button>
            )}
            {tool.preview ? (
              <div className="export-preview tool-preview">
                <span>Previsualização</span>
                <pre>{tool.preview}</pre>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function SettingsDock({
  companyName,
  connected,
  onToggle,
  settingsOpen,
}: {
  companyName: string;
  connected: boolean;
  onToggle: () => void;
  settingsOpen: boolean;
}) {
  return (
    <aside className={settingsOpen ? "settings-dock settings-dock-open" : "settings-dock"}>
      <button className="settings-trigger" type="button" onClick={onToggle} aria-label="Configuracoes">
        <Settings size={16} />
      </button>
      {settingsOpen ? (
        <div className="settings-popover">
          <div className={connected ? "server-status server-status-online" : "server-status server-status-offline"}>
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{connected ? "Conectado ao servidor" : "Servidor fora do ar / mock local"}</span>
          </div>
          <label>
            <span>Nome da Oficina</span>
            <input defaultValue={companyName} />
          </label>
          <label>
            <span>CNPJ</span>
            <input placeholder="00.000.000/0001-00" />
          </label>
          <label>
            <span>Responsável tecnico</span>
            <input placeholder="Nome do responsavel" />
          </label>
        </div>
      ) : null}
    </aside>
  );
}

function stageLabel(stage: ServiceOrder["stage"]) {
  const labels: Record<ServiceOrder["stage"], string> = {
    client_selection: "Cliente",
    diagnosis: "Diagnostico",
    budget: "Orcamento",
    service: "Servicos",
    notification: "Notificar",
    finance: "Pagamento",
    completed: "Concluida",
  };
  return labels[stage];
}

function BlockTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="block-title">
      <Icon size={22} />
      <strong>{title}</strong>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function LogoChip({ label }: { label: string }) {
  const firstWord = label.split(" ")[0] || "Auto";
  return <b className="logo-chip">{firstWord}</b>;
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("peca")
    ? "blue"
    : normalized.includes("concluido") || normalized.includes("entrega")
      ? "purple"
      : normalized.includes("pendente")
        ? "yellow"
        : "green";

  return <span className={`status-pill status-${tone}`}>{status}</span>;
}
