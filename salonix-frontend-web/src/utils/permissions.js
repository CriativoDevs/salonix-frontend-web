// Roles que podem ver cobrança (visão geral/histórico). O BE devolve 403 para
// colaborador (BE-SEC-01), então o front nem deve pedir.
const BILLING_ROLES = ['owner', 'manager'];

export function canViewBilling(user) {
  return BILLING_ROLES.includes(user?.staff_role);
}
