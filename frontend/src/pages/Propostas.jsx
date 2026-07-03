import CrmCrudPage from '../components/CrmCrudPage';
import { approvalStatusOptions, proposalStatusOptions, statusClass } from '../config/crmOptions';

const fields = [
  { name: 'number', label: 'Número da proposta', required: true },
  { name: 'title', label: 'Título da proposta', required: true },
  { name: 'document', label: 'Documento / referência', required: true },
  { name: 'status', label: 'Status comercial', type: 'select', options: proposalStatusOptions, defaultValue: 'rascunho' },
  { name: 'value', label: 'Valor', type: 'currency', defaultValue: 0 },
  { name: 'validUntil', label: 'Validade', type: 'date' },
  { name: 'paymentTerms', label: 'Condições de pagamento' },
  { name: 'description', label: 'Descrição comercial', type: 'textarea', full: true },
  { name: 'scope', label: 'Escopo da entrega', type: 'textarea', full: true },
];

function Propostas() {
  return (
    <CrmCrudPage
      title="Propostas"
      description="Controle propostas comerciais, valores, validade, escopo, condições e status de negociação até aprovação ou recusa."
      endpoint="/proposals"
      fields={fields}
      detailTitle="Detalhes da proposta"
      documentsConfig={{
        endpoint: '/proposal-documents',
        title: 'Documentos da proposta',
        fileField: 'document',
        requiredOnCreate: true,
      }}
      columns={[
        { key: 'number', label: 'Número' },
        { key: 'document', label: 'Documento' },
        { key: 'title', label: 'Proposta' },
        { key: 'status', label: 'Status comercial', badge: statusClass },
        { key: 'approvalStatus', label: 'Aprovação', badge: statusClass },
        { key: 'value', label: 'Valor', type: 'currency' },
        { key: 'validUntil', label: 'Validade', type: 'date' },
        { key: 'paymentTerms', label: 'Pagamento' },
      ]}
      filters={[
        { name: 'status', label: 'Status comercial', options: proposalStatusOptions },
        { name: 'approvalStatus', label: 'Aprovação', options: approvalStatusOptions },
      ]}
      stats={[
        { label: 'Propostas', description: 'Total emitido', getValue: (items) => items.length },
        { label: 'Em negociação', description: 'Aguardando decisão', getValue: (items) => items.filter((item) => ['enviada', 'em_negociacao'].includes(item.status)).length },
        { label: 'Aprovação pendente', description: 'Aguardando validação', getValue: (items) => items.filter((item) => item.approvalStatus === 'pendente').length },
        { label: 'Aprovadas', description: 'Valor validado', type: 'currency', getValue: (items) => items.filter((item) => item.status === 'aprovada' && item.approvalStatus === 'aprovado').reduce((sum, item) => sum + Number(item.value || 0), 0) },
        { label: 'Pipeline', description: 'Valor em aberto', type: 'currency', getValue: (items) => items.filter((item) => ['enviada', 'em_negociacao'].includes(item.status)).reduce((sum, item) => sum + Number(item.value || 0), 0) },
      ]}
      approvalConfig={{}}
      primaryAction="Cadastrar proposta"
    />
  );
}

export default Propostas;
