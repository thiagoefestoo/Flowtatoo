import CrmCrudPage from '../components/CrmCrudPage';
import { contractOptions, seniorityOptions, statusBadge, workModelOptions } from './hrOptions';

const fields = [
  { name: 'employeeName', label: 'Colaborador', required: true },
  { name: 'jobTitle', label: 'Cargo' },
  { name: 'type', label: 'Tipo', type: 'select', defaultValue: 'pedido_demissao', options: [
    { value: 'pedido_demissao', label: 'Pedido de demissão' }, { value: 'empresa_sem_justa_causa', label: 'Empresa sem justa causa' }, { value: 'empresa_com_justa_causa', label: 'Empresa com justa causa' }, { value: 'termino_contrato', label: 'Término de contrato' }, { value: 'acordo', label: 'Acordo' }
  ] },
  { name: 'requestedAt', label: 'Solicitado em', type: 'date' },
  { name: 'lastDay', label: 'Último dia', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', defaultValue: 'em_andamento', options: [
    { value: 'em_andamento', label: 'Em andamento' }, { value: 'aviso_previo', label: 'Aviso prévio' }, { value: 'documentos_pendentes', label: 'Documentos pendentes' }, { value: 'concluido', label: 'Concluído' }, { value: 'cancelado', label: 'Cancelado' }
  ] },
  { name: 'accessBlocked', label: 'Acessos bloqueados', type: 'select', defaultValue: false, options: [ { value: true, label: 'Sim' }, { value: false, label: 'Não' } ] },
  { name: 'equipmentReturned', label: 'Equipamentos devolvidos', type: 'select', defaultValue: false, options: [ { value: true, label: 'Sim' }, { value: false, label: 'Não' } ] },
  { name: 'exitInterviewDone', label: 'Entrevista de desligamento', type: 'select', defaultValue: false, options: [ { value: true, label: 'Sim' }, { value: false, label: 'Não' } ] },
  { name: 'notes', label: 'Observações', type: 'textarea', full: true },
];

const columns = [
  { key: 'employeeName', label: 'Colaborador' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'type', label: 'Tipo' },
  { key: 'lastDay', label: 'Último dia', type: 'date' },
  { key: 'status', label: 'Status', badge: statusBadge },
];

const filters = [
  { name: 'status', label: 'Status', options: [ { value: 'em_andamento', label: 'Em andamento' }, { value: 'aviso_previo', label: 'Aviso prévio' }, { value: 'documentos_pendentes', label: 'Documentos pendentes' }, { value: 'concluido', label: 'Concluído' } ] },
];

const stats = [
  { label: 'Em andamento', description: 'processos ativos', getValue: (items) => items.filter((item) => !['concluido','cancelado'].includes(item.status)).length },
  { label: 'Concluídos', description: 'processos encerrados', getValue: (items) => items.filter((item) => item.status === 'concluido').length },
  { label: 'Com entrevista', description: 'entrevista realizada', getValue: (items) => items.filter((item) => item.exitInterviewDone === true || item.exitInterviewDone === 'true').length },
];

function Desligamentos() {
  return (
    <CrmCrudPage
      title="Desligamentos"
      eyebrow="FLOWTATOO CORE"
      description="Controle processo de saída, aviso prévio, devolução de equipamentos, bloqueio de acessos e entrevista de desligamento."
      endpoint="/terminations"
      fields={fields}
      columns={columns}
      filters={filters}
      stats={stats}
      primaryAction="Abrir desligamento"
      detailTitle="Detalhes - Desligamentos"
    />
  );
}

export default Desligamentos;
