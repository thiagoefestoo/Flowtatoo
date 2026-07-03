export const leadStatusOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'desqualificado', label: 'Desqualificado' },
  { value: 'convertido', label: 'Convertido' },
];

export const temperatureOptions = [
  { value: 'frio', label: 'Frio' },
  { value: 'morno', label: 'Morno' },
  { value: 'quente', label: 'Quente' },
];

export const sourceOptions = [
  { value: 'site', label: 'Site' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
];

export const opportunityStageOptions = [
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'ganha', label: 'Ganha' },
  { value: 'perdida', label: 'Perdida' },
];

export const opportunityStatusOptions = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'ganha', label: 'Ganha' },
  { value: 'perdida', label: 'Perdida' },
  { value: 'pausada', label: 'Pausada' },
];

export const activityTypeOptions = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'visita', label: 'Visita' },
  { value: 'tarefa', label: 'Tarefa' },
  { value: 'follow_up', label: 'Follow-up' },
];

export const activityStatusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];


export const approvalStatusOptions = [
  { value: 'nao_enviado', label: 'Não enviado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
];

export const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

export const interactionChannelOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'visita', label: 'Visita' },
  { value: 'chat', label: 'Chat' },
  { value: 'outro', label: 'Outro' },
];

export const directionOptions = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
];

export const proposalStatusOptions = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'em_negociacao', label: 'Em negociação' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'recusada', label: 'Recusada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const campaignChannelOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'outro', label: 'Outro' },
];

export const campaignStatusOptions = [
  { value: 'planejada', label: 'Planejada' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function statusClass(value) {
  const safe = String(value || 'neutro').replaceAll('_', '-');
  return `crm-status-${safe}`;
}
