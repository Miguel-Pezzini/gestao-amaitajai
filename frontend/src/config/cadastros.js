import { ClipboardList, DoorOpen, Layers3, SlidersHorizontal, UserCog, Wallet } from "lucide-react";

export const CADASTROS_GROUP = {
  id: "cadastros",
  label: "Cadastros Gerais",
  routePrefix: "/cadastros",
  requiredRoles: ["ADMINISTRADOR"],
  order: 3,
};

export const CADASTRO_ITEMS = [
  {
    id: "modalidades",
    label: "Modalidades",
    description: "Cadastre e gerencie modalidades de atendimento.",
    icon: Layers3,
    route: "/cadastros/modalidades",
    order: 0,
  },
  {
    id: "salas",
    label: "Salas",
    description: "Cadastre salas e ambientes de atendimento.",
    icon: DoorOpen,
    route: "/cadastros/salas",
    order: 1,
  },
  {
    id: "tipos-sessao",
    label: "Tipos de Sessão",
    description: "Configure limites mínimos e máximos por tipo de sessão.",
    icon: SlidersHorizontal,
    route: "/cadastros/tipos-sessao",
    order: 2,
  },
  {
    id: "tipos-protocolo",
    label: "Tipos de Protocolo",
    description: "Cadastre os tipos de solicitação usados nos protocolos.",
    icon: ClipboardList,
    route: "/cadastros/tipos-protocolo",
    order: 3,
  },
  {
    id: "tipos-custeio",
    label: "Fontes de Custeio",
    description: "Cadastre as fontes de custeio dos atendidos.",
    icon: Wallet,
    route: "/cadastros/tipos-custeio",
    order: 4,
  },
  {
    id: "funcionarios",
    label: "Funcionários",
    description: "Cadastre funcionários e permissões de acesso ao sistema.",
    icon: UserCog,
    route: "/cadastros/funcionarios",
    order: 5,
  },
];
