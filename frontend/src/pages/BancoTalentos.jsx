import CrmCrudPage from '../components/CrmCrudPage';
import { candidateSelectField, hiddenCandidateNameField } from './hrCandidateFields';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  candidateSelectField(),
  hiddenCandidateNameField,
  { name: 'email', label: 'E-mail', type: 'email', readOnly: true },
  { name: 'phone', label: 'Telefone', readOnly: true },
  { name: 'area', label: 'Área de interesse', required: true },
  { name: 'level', label: 'Nível', type: 'select', options: seniorityOptions, defaultValue: 'pleno' },
  { name: 'availability', label: 'Disponibilidade', type: 'select', defaultValue: 'imediata', options: [
    { value: 'imediata', label: 'Imediata' }, { value: 'ate_15_dias', label: 'Até 15 dias' }, { value: 'ate_30_dias', label: 'Até 30 dias' }, { value: 'empregado', label: 'Empregado' }, { value: 'indisponivel', label: 'Indisponível' }
  ] },
  { name: 'rating', label: 'Avaliação', type: 'number', min: 0, max: 10 },
  { name: 'lastContactAt', label: 'Último contato', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
    { value: 'ativo', label: 'Ativo' }, { value: 'em_contato', label: 'Em contato' }, { value: 'reservado', label: 'Reservado' }, { value: 'inativo', label: 'Inativo' }
  ] },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'candidateName', label: 'Candidato' },
  { key: 'area', label: 'Área' },
  { key: 'level', label: 'Nível' },
  { key: 'availability', label: 'Disponibilidade' },
  { key: 'rating', label: 'Nota' },
  { key: 'status', label: 'Status', badge: statusBadge },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'ativo', label: 'Ativo' }, { value: 'em_contato', label: 'Em contato' }, { value: 'reservado', label: 'Reservado' }, { value: 'inativo', label: 'Inativo' } ] },
];

const stats = [
  { label: 'Talentos', description: 'total no banco', getValue: (items) => items.length },
  { label: 'Ativos', description: 'disponíveis para contato', getValue: (items) => items.filter((item) => item.status === 'ativo').length },
  { label: 'Reservados', description: 'em tratativa', getValue: (items) => items.filter((item) => item.status === 'reservado').length },
];

function BancoTalentos() {
  return (
    <CrmCrudPage
      title="Banco de talentos"
      eyebrow="FLOWTATOO CORE"
      description="Mantenha candidatos qualificados para futuras oportunidades e controle disponibilidade, área e avaliação."
      endpoint="/talent-pool"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Adicionar talento"
      detailTitle="Detalhes - Banco de talentos"
    />
  );
}

export default BancoTalentos;
