import CrmCrudPage from '../components/CrmCrudPage';
import { approvalStatusOptions, opportunityStageOptions, opportunityStatusOptions, statusClass } from '../config/crmOptions';

const fields = [
  { name: 'title', label: 'Título da oportunidade', required: true },
  { name: 'document', label: 'Documento / referência', required: true },
  { name: 'stage', label: 'Etapa do funil', type: 'select', options: opportunityStageOptions, defaultValue: 'prospeccao' },
  { name: 'status', label: 'Status', type: 'select', options: opportunityStatusOptions, defaultValue: 'aberta' },
  { name: 'value', label: 'Valor previsto', type: 'currency', defaultValue: 0 },
  { name: 'probability', label: 'Probabilidade (%)', type: 'number', min: 0, max: 100, defaultValue: 10 },
  { name: 'source', label: 'Origem' },
  { name: 'expectedCloseDate', label: 'Previsão de fechamento', type: 'date' },
  { name: 'lostReason', label: 'Motivo de perda' },
  { name: 'description', label: 'Descrição da necessidade', type: 'textarea', full: true },
];

function Oportunidades() {
  return (
    <CrmCrudPage
      title="Oportunidades"
      description="Acompanhe negociações abertas, valor de pipeline, probabilidade de fechamento e evolução por etapa comercial."
      endpoint="/opportunities"
      fields={fields}
      columns={[
        { key: 'title', label: 'Oportunidade' },
        { key: 'document', label: 'Documento' },
        { key: 'stage', label: 'Etapa', badge: statusClass },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'approvalStatus', label: 'Aprovação', badge: statusClass },
        { key: 'value', label: 'Valor', type: 'currency' },
        { key: 'probability', label: 'Prob.', type: 'percent' },
        { key: 'expectedCloseDate', label: 'Fechamento', type: 'date' },
      ]}
      filters={[
        { name: 'stage', label: 'Etapa', options: opportunityStageOptions },
        { name: 'status', label: 'Status', options: opportunityStatusOptions },
        { name: 'approvalStatus', label: 'Aprovação', options: approvalStatusOptions },
      ]}
      stats={[
        { label: 'Oportunidades', description: 'Total no CRM', getValue: (items) => items.length },
        { label: 'Abertas', description: 'Negociações em andamento', getValue: (items) => items.filter((item) => item.status === 'aberta').length },
        { label: 'Pipeline', description: 'Valor em aberto', type: 'currency', getValue: (items) => items.filter((item) => item.status === 'aberta').reduce((sum, item) => sum + Number(item.value || 0), 0) },
        { label: 'Aprovação pendente', description: 'Aguardando validação', getValue: (items) => items.filter((item) => item.approvalStatus === 'pendente').length },
        { label: 'Ganhas aprovadas', description: 'Valor validado', type: 'currency', getValue: (items) => items.filter((item) => item.status === 'ganha' && item.approvalStatus === 'aprovado').reduce((sum, item) => sum + Number(item.value || 0), 0) },
      ]}
      documentsConfig={{
        endpoint: '/entity-documents/crm_opportunity',
        title: 'Documentos da oportunidade',
        fileField: 'document',
        requiredOnCreate: true,
      }}
      approvalConfig={{}}
      primaryAction="Cadastrar oportunidade"
    />
  );
}

export default Oportunidades;
