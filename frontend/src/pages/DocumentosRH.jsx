import CrmCrudPage from '../components/CrmCrudPage';
import { candidateSelectField, hiddenPersonNameField } from './hrCandidateFields';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  candidateSelectField({ personType: () => 'candidato' }),
  hiddenPersonNameField,
  { name: 'personType', label: 'Tipo de pessoa', type: 'hidden', defaultValue: 'candidato' },
  { name: 'documentType', label: 'Tipo de documento', required: true },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'pendente', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'enviado', label: 'Enviado' }, { value: 'validado', label: 'Validado' }, { value: 'recusado', label: 'Recusado' }, { value: 'vencido', label: 'Vencido' } ] },
  { name: 'dueDate', label: 'Vencimento', type: 'date' },
  { name: 'fileUrl', label: 'Link do arquivo' },
  { name: 'validatedBy', label: 'Validado por' },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'personName', label: 'Pessoa' },
  { key: 'personType', label: 'Tipo' },
  { key: 'documentType', label: 'Documento' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'dueDate', label: 'Vencimento', type: 'date' },
  { key: 'validatedBy', label: 'Validado por' },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'pendente', label: 'Pendente' }, { value: 'enviado', label: 'Enviado' }, { value: 'validado', label: 'Validado' }, { value: 'recusado', label: 'Recusado' }, { value: 'vencido', label: 'Vencido' } ] },
];

const stats = [
  { label: 'Pendentes', description: 'aguardando ação', getValue: (items) => items.filter((item) => ['pendente','enviado','recusado','vencido'].includes(item.status)).length },
  { label: 'Validados', description: 'documentos conferidos', getValue: (items) => items.filter((item) => item.status === 'validado').length },
  { label: 'Vencidos', description: 'precisam atualização', getValue: (items) => items.filter((item) => item.status === 'vencido').length },
];

function DocumentosRH() {
  return (
    <CrmCrudPage
      title="Documentos RH"
      eyebrow="FLOWTATOO CORE"
      description="Controle documentos de candidatos e colaboradores, vencimentos, validações e pendências."
      endpoint="/hr-documents"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Cadastrar documento"
      detailTitle="Detalhes - Documentos RH"
    />
  );
}

export default DocumentosRH;
