import CrmCrudPage from '../components/CrmCrudPage';
import {
  activityStatusOptions,
  activityTypeOptions,
  approvalStatusOptions,
  priorityOptions,
  statusClass,
} from '../config/crmOptions';

const fields = [
  { name: 'title', label: 'Título da atividade', required: true },
  { name: 'document', label: 'Documento / referência', required: true },
  { name: 'type', label: 'Tipo', type: 'select', options: activityTypeOptions, defaultValue: 'follow_up' },
  { name: 'status', label: 'Status', type: 'select', options: activityStatusOptions, defaultValue: 'pendente' },
  { name: 'priority', label: 'Prioridade', type: 'select', options: priorityOptions, defaultValue: 'media' },
  { name: 'dueDate', label: 'Data e hora prevista', type: 'datetime' },
  { name: 'completedAt', label: 'Concluída em', type: 'datetime' },
  { name: 'description', label: 'Descrição / roteiro de contato', type: 'textarea', full: true },
  { name: 'result', label: 'Resultado / retorno do cliente', type: 'textarea', full: true },
];

function isOverdue(item) {
  if (!item.dueDate || ['concluida', 'cancelada'].includes(item.status)) return false;
  return new Date(item.dueDate) < new Date();
}

function Atividades() {
  return (
    <CrmCrudPage
      title="Atividades"
      description="Organize follow-ups, reuniões, tarefas comerciais, documentos de apoio e aprovações para não perder prazos de relacionamento."
      endpoint="/activities"
      fields={fields}
      detailTitle="Detalhes da atividade"
      documentsConfig={{
        endpoint: '/activity-documents',
        title: 'Documentos da atividade',
        fileField: 'document',
        requiredOnCreate: true,
      }}
      approvalConfig={{
        sendPath: 'send-approval',
        approvePath: 'approve',
        rejectPath: 'reject',
      }}
      columns={[
        { key: 'title', label: 'Atividade' },
        { key: 'document', label: 'Documento' },
        { key: 'type', label: 'Tipo', badge: statusClass },
        { key: 'priority', label: 'Prioridade', badge: statusClass },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'approvalStatus', label: 'Aprovação', badge: statusClass },
        { key: 'dueDate', label: 'Prazo', type: 'datetime' },
        { key: 'result', label: 'Resultado' },
      ]}
      filters={[
        { name: 'type', label: 'Tipo', options: activityTypeOptions },
        { name: 'status', label: 'Status', options: activityStatusOptions },
        { name: 'priority', label: 'Prioridade', options: priorityOptions },
        { name: 'approvalStatus', label: 'Aprovação', options: approvalStatusOptions },
      ]}
      stats={[
        { label: 'Atividades', description: 'Total registrado', getValue: (items) => items.length },
        { label: 'Pendentes', description: 'Aguardando ação', getValue: (items) => items.filter((item) => ['pendente', 'em_andamento'].includes(item.status)).length },
        { label: 'Vencidas', description: 'Precisam de atenção', getValue: (items) => items.filter(isOverdue).length },
        { label: 'Em aprovação', description: 'Aguardando validação', getValue: (items) => items.filter((item) => item.approvalStatus === 'pendente').length },
        { label: 'Aprovadas', description: 'Liberadas para contabilizar ganhos', getValue: (items) => items.filter((item) => item.approvalStatus === 'aprovado').length },
      ]}
      primaryAction="Criar atividade"
    />
  );
}

export default Atividades;
