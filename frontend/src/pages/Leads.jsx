import CrmCrudPage from '../components/CrmCrudPage';
import { leadStatusOptions, sourceOptions, statusClass, temperatureOptions } from '../config/crmOptions';

const fields = [
  { name: 'name', label: 'Nome do contato' },
  { name: 'company', label: 'Empresa' },
  { name: 'email', label: 'E-mail' },
  { name: 'phone', label: 'WhatsApp / Telefone' },
  { name: 'segment', label: 'Segmento' },
  { name: 'city', label: 'Cidade' },
  { name: 'state', label: 'UF' },
  { name: 'source', label: 'Origem', type: 'select', options: sourceOptions, defaultValue: 'site' },
  { name: 'status', label: 'Status', type: 'select', options: leadStatusOptions, defaultValue: 'novo' },
  { name: 'temperature', label: 'Temperatura', type: 'select', options: temperatureOptions, defaultValue: 'morno' },
  { name: 'score', label: 'Score', type: 'number', min: 0, max: 100, defaultValue: 0 },
  { name: 'estimatedValue', label: 'Valor estimado', type: 'currency', defaultValue: 0 },
  { name: 'interest', label: 'Interesse / necessidade', full: true },
  { name: 'nextContactAt', label: 'Próximo contato', type: 'datetime' },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

function Leads() {
  return (
    <CrmCrudPage
      title="Leads"
      description="Controle contatos recebidos pelo site, WhatsApp, indicações, redes sociais e campanhas. Priorize quem tem maior potencial de conversão."
      endpoint="/leads"
      fields={fields}
      columns={[
        { key: 'name', label: 'Lead' },
        { key: 'company', label: 'Empresa' },
        { key: 'phone', label: 'Contato' },
        { key: 'source', label: 'Origem' },
        { key: 'temperature', label: 'Temperatura', badge: statusClass },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'estimatedValue', label: 'Valor', type: 'currency' },
        { key: 'nextContactAt', label: 'Próximo contato', type: 'datetime' },
      ]}
      filters={[
        { name: 'status', label: 'Status', options: leadStatusOptions },
        { name: 'temperature', label: 'Temperatura', options: temperatureOptions },
        { name: 'source', label: 'Origem', options: sourceOptions },
      ]}
      stats={[
        { label: 'Leads', description: 'Total cadastrado', getValue: (items) => items.length },
        { label: 'Quentes', description: 'Maior prioridade', getValue: (items) => items.filter((item) => item.temperature === 'quente').length },
        { label: 'Qualificados', description: 'Prontos para oportunidade', getValue: (items) => items.filter((item) => item.status === 'qualificado').length },
        { label: 'Potencial', description: 'Valor estimado', type: 'currency', getValue: (items) => items.reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0) },
      ]}
      primaryAction="Cadastrar lead"
    />
  );
}

export default Leads;
