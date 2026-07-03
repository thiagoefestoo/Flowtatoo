import CrmCrudPage from '../components/CrmCrudPage';
import { approvalStatusOptions, statusClass } from '../config/crmOptions';

const typeOptions = [
  { value: 'pessoa_juridica', label: 'Pessoa Jurídica' },
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
];

const customerStatusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'bloqueado', label: 'Bloqueado' },
];

const fields = [
  { name: 'type', label: 'Tipo', type: 'select', options: typeOptions, defaultValue: 'pessoa_juridica' },
  { name: 'name', label: 'Nome / Razão social', required: true },
  { name: 'tradeName', label: 'Nome fantasia' },
  { name: 'document', label: 'CPF/CNPJ', required: true },
  { name: 'email', label: 'E-mail' },
  { name: 'phone', label: 'Telefone principal' },
  { name: 'secondaryPhone', label: 'Telefone secundário' },
  { name: 'segment', label: 'Segmento' },
  { name: 'city', label: 'Cidade' },
  { name: 'state', label: 'UF' },
  { name: 'status', label: 'Status', type: 'select', options: customerStatusOptions, defaultValue: 'ativo' },
  { name: 'notes', label: 'Observações comerciais', type: 'textarea', full: true },
];

function Clientes() {
  return (
    <CrmCrudPage
      title="Clientes"
      description="Centralize dados comerciais dos clientes, segmentos atendidos, contatos e observações importantes para relacionamento e venda recorrente."
      endpoint="/customers"
      fields={fields}
      columns={[
        { key: 'name', label: 'Cliente' },
        { key: 'tradeName', label: 'Fantasia' },
        { key: 'document', label: 'Documento' },
        { key: 'phone', label: 'Contato' },
        { key: 'segment', label: 'Segmento' },
        { key: 'city', label: 'Cidade' },
        { key: 'status', label: 'Status', badge: statusClass },
        { key: 'approvalStatus', label: 'Aprovação', badge: statusClass },
      ]}
      filters={[
        { name: 'type', label: 'Tipo', options: typeOptions },
        { name: 'status', label: 'Status', options: customerStatusOptions },
        { name: 'approvalStatus', label: 'Aprovação', options: approvalStatusOptions },
      ]}
      stats={[
        { label: 'Clientes', description: 'Base cadastrada', getValue: (items) => items.length },
        { label: 'Ativos', description: 'Relacionamento ativo', getValue: (items) => items.filter((item) => item.status === 'ativo').length },
        { label: 'Aprovação pendente', description: 'Aguardando validação', getValue: (items) => items.filter((item) => item.approvalStatus === 'pendente').length },
        { label: 'Aprovados', description: 'Clientes validados', getValue: (items) => items.filter((item) => item.approvalStatus === 'aprovado').length },
        { label: 'Segmentos', description: 'Mercados atendidos', getValue: (items) => new Set(items.map((item) => item.segment).filter(Boolean)).size },
      ]}
      documentsConfig={{
        endpoint: '/customer-documents',
        title: 'Documentos do cliente',
        fileField: 'document',
        requiredOnCreate: true,
      }}
      approvalConfig={{}}
      primaryAction="Cadastrar cliente"
    />
  );
}

export default Clientes;
