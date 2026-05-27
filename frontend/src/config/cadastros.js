import { DoorOpen, Layers3, UserCog } from "lucide-react";

export const CADASTROS_GROUP = {
  id: "cadastros",
  label: "Cadastros Gerais",
  routePrefix: "/cadastros",
  requiredRoles: ["administrador"],
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
    id: "funcionarios",
    label: "Funcionários",
    description: "Cadastre funcionários e permissões de acesso ao sistema.",
    icon: UserCog,
    route: "/cadastros/funcionarios",
    order: 2,
  },
];
