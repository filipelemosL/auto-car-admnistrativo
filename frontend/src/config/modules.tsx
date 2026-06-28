import {
  BellRing,
  Calculator,
  ClipboardList,
  LayoutDashboard,
  Landmark,
  Users,
} from "lucide-react";

export interface ModuleLink {
  title: string;
  path: string;
  description: string;
  icon: typeof LayoutDashboard;
}

export const moduleLinks: ModuleLink[] = [
  {
    title: "Dashboard",
    path: "/",
    description: "Visao consolidada da oficina e alertas operacionais",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    path: "/clientes",
    description: "Clientes, veiculos e historico de relacionamento",
    icon: Users,
  },
  {
    title: "Orcamentos",
    path: "/orcamentos",
    description: "Estruturacao, aprovacao e exportacao",
    icon: Calculator,
  },
  {
    title: "Servicos",
    path: "/servicos",
    description: "Checklist tecnico, notas e evidencias",
    icon: ClipboardList,
  },
  {
    title: "Lembretes",
    path: "/lembretes",
    description: "Agenda recorrente por cliente e canal",
    icon: BellRing,
  },
  {
    title: "Financeiro",
    path: "/financeiro",
    description: "Notas, recibos, custos, receitas e resumos",
    icon: Landmark,
  },
];
