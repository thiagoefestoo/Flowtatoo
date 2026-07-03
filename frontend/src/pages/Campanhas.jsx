import CrmCrudPage from '../components/CrmCrudPage';
import { approvalStatusOptions, campaignChannelOptions, campaignStatusOptions, statusClass } from '../config/crmOptions';

const fields = [
  { name: 'name', label: 'Nome da campanha', required: true },
  { name: 'document', label: 'Documento / referência', required: true },
  { name: 'channel', label: 'Canal', type: 'select', options: campaignChannelOptions, defaultValue: 'instagram' },
  { name: 'status', label: 'Status', type: 'select', options: campaignStatusOptions, defaultValue: 'planejada' },
  { name: 'budget', label: 'Orçamento', type: 'currency', defaultValue: 0 },
  { name: 'leadsGenerated', label: 'Leads gerados', type: 'number', defaultValue: 0 },
  { name: 'opportunitiesGenerated', label: 'Oportunidades geradas', type: 'number', defaultValue: 0 },
  { name: 'expectedRevenue', label: 'Receita esperada', type: 'currency', defaultValue: 0 },
  { name: 'startDate', label: 'Início', type: 'date' },
  { name: 'endDate', label: 'Fim', type: 'date' },
  { name: 'notes', label: 'Observações e estratégia', type: 'textarea', full: true },
];

function Campanhas() {
  return (
    <CrmCrudPage
      title="Campanhas"
      description="Acompanhe campanhas, canais de aquisição, orçamento, leads gerados, oportunidades criadas e retorno comercial esperado."
      endpoint="/campaigns"
      fields={fields}
      columns={[
        { key: 'name', label: 'Campanha' },
        { key: 'document', label: 'Documento' },
        { key: 'channel', label: 'Canal', badge: statusClass },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'approvalStatus', label: 'Aprovação', badge: statusClass },
        { key: 'budget', label: 'Orçamento', type: 'currency' },
        { key: 'leadsGenerated', label: 'Leads' },
        { key: 'opportunitiesGenerated', label: 'Oportunidades' },
        { key: 'expectedRevenue', label: 'Receita esperada', type: 'currency' },
      ]}
      filters={[
        { name: 'channel', label: 'Canal', options: campaignChannelOptions },
        { name: 'status', label: 'Status', options: campaignStatusOptions },
        { name: 'approvalStatus', label: 'Aprovação', options: approvalStatusOptions },
      ]}
      stats={[
        { label: 'Campanhas', description: 'Total cadastrado', getValue: (items) => items.length },
        { label: 'Ativas', description: 'Em execução', getValue: (items) => items.filter((item) => item.status === 'ativa').length },
        { label: 'Aprovação pendente', description: 'Aguardando validação', getValue: (items) => items.filter((item) => item.approvalStatus === 'pendente').length },
        { label: 'Leads', description: 'Gerados pelas campanhas', getValue: (items) => items.reduce((sum, item) => sum + Number(item.leadsGenerated || 0), 0) },
        { label: 'Receita esperada', description: 'Potencial mapeado', type: 'currency', getValue: (items) => items.reduce((sum, item) => sum + Number(item.expectedRevenue || 0), 0) },
      ]}
      documentsConfig={{
        endpoint: '/entity-documents/crm_campaign',
        title: 'Documentos da campanha',
        fileField: 'document',
        requiredOnCreate: true,
      }}
      approvalConfig={{}}
      primaryAction="Cadastrar campanha"
    />
  );
}

export default Campanhas;
