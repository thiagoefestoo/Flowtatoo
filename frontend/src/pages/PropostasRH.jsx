import CrmCrudPage from '../components/CrmCrudPage';
import { candidateSelectField, hiddenCandidateNameField } from './hrCandidateFields';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  candidateSelectField(),
  hiddenCandidateNameField,
  { name: 'jobTitle', label: 'Cargo', required: true },
  { name: 'salary', label: 'Salário', type: 'currency' },
  { name: 'contractType', label: 'Contrato', type: 'select', options: contractOptions, defaultValue: 'clt' },
  { name: 'workModel', label: 'Modelo', type: 'select', options: workModelOptions, defaultValue: 'presencial' },
  { name: 'startDate', label: 'Data prevista de início', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'em_elaboracao', options: [
    { value: 'em_elaboracao', label: 'Em elaboração' }, { value: 'enviada', label: 'Enviada' }, { value: 'aceita', label: 'Aceita' }, { value: 'recusada', label: 'Recusada' }, { value: 'negociacao', label: 'Negociação' }, { value: 'cancelada', label: 'Cancelada' }
  ] },
  { name: 'sentAt', label: 'Enviada em', type: 'date' },
  { name: 'acceptedAt', label: 'Aceita em', type: 'date' },
  { name: 'benefits', label: 'Benefícios', type: 'textarea', full: true },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'candidateName', label: 'Candidato' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'salary', label: 'Salário', type: 'currency' },
  { key: 'contractType', label: 'Contrato' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'startDate', label: 'Início', type: 'date' },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'em_elaboracao', label: 'Em elaboração' }, { value: 'enviada', label: 'Enviada' }, { value: 'aceita', label: 'Aceita' }, { value: 'recusada', label: 'Recusada' }, { value: 'negociacao', label: 'Negociação' } ] },
];

const stats = [
  { label: 'Propostas', description: 'total cadastrado', getValue: (items) => items.length },
  { label: 'Enviadas', description: 'aguardando retorno', getValue: (items) => items.filter((item) => item.status === 'enviada').length },
  { label: 'Aceitas', description: 'para admissão', getValue: (items) => items.filter((item) => item.status === 'aceita').length },
];

function PropostasRH() {
  return (
    <CrmCrudPage
      title="Propostas"
      eyebrow="FLOWTATOO CORE"
      description="Controle propostas enviadas, negociação, aceite, salário, benefícios e previsão de início."
      endpoint="/hr-proposals"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Cadastrar proposta"
      detailTitle="Detalhes - Propostas"
    />
  );
}

export default PropostasRH;
