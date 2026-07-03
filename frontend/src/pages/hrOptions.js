export const seniorityOptions = [
  { value: 'estagio', label: 'Estágio' },
  { value: 'junior', label: 'Júnior' },
  { value: 'pleno', label: 'Pleno' },
  { value: 'senior', label: 'Sênior' },
  { value: 'lideranca', label: 'Liderança' },
  { value: 'especialista', label: 'Especialista' },
];

export const contractOptions = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'temporario', label: 'Temporário' },
  { value: 'estagio', label: 'Estágio' },
  { value: 'aprendiz', label: 'Aprendiz' },
  { value: 'terceiro', label: 'Terceiro' },
];

export const workModelOptions = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'remoto', label: 'Remoto' },
];

export const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export const yesNoOptions = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
];

export function statusBadge(value) {
  if (['ativo', 'aberta', 'aprovado', 'aceita', 'concluida', 'contratado', 'validado', 'assinado', 'liberado'].includes(value)) return 'success';
  if (['pendente', 'em_andamento', 'em_analise', 'agendada', 'confirmada', 'em_triagem', 'em_processo'].includes(value)) return 'info';
  if (['urgente', 'alta', 'atrasada', 'vencido', 'recusado', 'reprovado', 'cancelada', 'cancelado', 'desligado'].includes(value)) return 'danger';
  return 'warning';
}
