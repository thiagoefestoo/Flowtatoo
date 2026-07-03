export const ROLE_LABELS = {
  admin: 'Dono do estúdio',
  rh: 'Dono do estúdio',
  gestor: 'Gerente',
  operador: 'Atendimento',
  entrevistador: 'Tatuador',
  colaborador: 'Colaborador',
  viewer: 'Consulta',
};

export const ROUTE_PERMISSIONS = {
  '/dashboard': ['admin', 'rh', 'gestor', 'operador', 'entrevistador', 'viewer'],
  '/agenda': ['admin', 'rh', 'gestor', 'operador', 'entrevistador', 'viewer'],
  '/clientes': ['admin', 'rh', 'gestor', 'operador', 'viewer'],
  '/meu-perfil': ['admin', 'rh', 'gestor', 'operador', 'viewer'],
  '/bi-gerencial': ['admin', 'rh', 'gestor', 'viewer'],
  '/configuracoes': ['admin', 'rh', 'gestor', 'operador', 'entrevistador', 'colaborador', 'viewer'],
  '/alertas': ['admin', 'rh', 'gestor', 'operador', 'entrevistador', 'colaborador', 'viewer'],
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || 'Perfil não informado';
}

export function hasRoutePermission(role, path) {
  const allowedRoles = ROUTE_PERMISSIONS[path];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
