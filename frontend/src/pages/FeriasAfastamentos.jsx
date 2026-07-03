import CrmCrudPage from '../components/CrmCrudPage';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  { name: 'employeeName', label: 'Colaborador', required: true },
  { name: 'type', label: 'Tipo', type: 'select', defaultValue: 'ferias', options: [
    { value: 'ferias', label: 'Férias' }, { value: 'atestado', label: 'Atestado' }, { value: 'licenca', label: 'Licença' }, { value: 'afastamento', label: 'Afastamento' }, { value: 'ausencia_justificada', label: 'Ausência justificada' }, { value: 'banco_horas', label: 'Banco de horas' }
  ] },
  { name: 'startDate', label: 'Início', type: 'date', required: true },
  { name: 'endDate', label: 'Fim', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'solicitado', options: [
    { value: 'solicitado', label: 'Solicitado' }, { value: 'em_analise', label: 'Em análise' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' }, { value: 'cancelado', label: 'Cancelado' }, { value: 'concluido', label: 'Concluído' }
  ] },
  { name: 'approvedBy', label: 'Aprovado por' },
  { name: 'reason', label: 'Motivo', type: 'textarea', full: true },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'employeeName', label: 'Colaborador' },
  { key: 'type', label: 'Tipo' },
  { key: 'startDate', label: 'Início', type: 'date' },
  { key: 'endDate', label: 'Fim', type: 'date' },
  { key: 'status', label: 'Status', badge: statusBadge },
  { key: 'approvedBy', label: 'Aprovado por' },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'solicitado', label: 'Solicitado' }, { value: 'em_analise', label: 'Em análise' }, { value: 'aprovado', label: 'Aprovado' }, { value: 'reprovado', label: 'Reprovado' } ] },
];

const stats = [
  { label: 'Solicitações', description: 'total registrado', getValue: (items) => items.length },
  { label: 'Em análise', description: 'pendentes de decisão', getValue: (items) => items.filter((item) => ['solicitado','em_analise'].includes(item.status)).length },
  { label: 'Aprovadas', description: 'liberadas', getValue: (items) => items.filter((item) => item.status === 'aprovado').length },
];

function FeriasAfastamentos() {
  return (
    <CrmCrudPage
      title="Férias e afastamentos"
      eyebrow="FLOWTATOO CORE"
      description="Controle férias, atestados, licenças, afastamentos, ausências e banco de horas."
      endpoint="/time-off-requests"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Cadastrar solicitação"
      detailTitle="Detalhes - Férias e afastamentos"
    />
  );
}

export default FeriasAfastamentos;
