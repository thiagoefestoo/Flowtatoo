import CrmCrudPage from '../components/CrmCrudPage';
import { directionOptions, interactionChannelOptions, statusClass } from '../config/crmOptions';

const fields = [
  { name: 'subject', label: 'Assunto' },
  { name: 'channel', label: 'Canal', type: 'select', options: interactionChannelOptions, defaultValue: 'whatsapp' },
  { name: 'direction', label: 'Direção', type: 'select', options: directionOptions, defaultValue: 'saida' },
  { name: 'interactionDate', label: 'Data da interação', type: 'datetime' },
  { name: 'content', label: 'Resumo da conversa', type: 'textarea', full: true },
  { name: 'nextStep', label: 'Próximo passo', full: true },
];

function Interacoes() {
  return (
    <CrmCrudPage
      title="Interações"
      description="Registre o histórico de conversas por WhatsApp, e-mail, telefone, reunião ou visita, preservando contexto e próximos passos."
      endpoint="/interactions"
      fields={fields}
      columns={[
        { key: 'subject', label: 'Assunto' },
        { key: 'channel', label: 'Canal', badge: statusClass },
        { key: 'direction', label: 'Direção', badge: statusClass },
        { key: 'interactionDate', label: 'Data', type: 'datetime' },
        { key: 'nextStep', label: 'Próximo passo' },
      ]}
      filters={[
        { name: 'channel', label: 'Canal', options: interactionChannelOptions },
        { name: 'direction', label: 'Direção', options: directionOptions },
      ]}
      stats={[
        { label: 'Interações', description: 'Total registrado', getValue: (items) => items.length },
        { label: 'WhatsApp', description: 'Conversas pelo canal', getValue: (items) => items.filter((item) => item.channel === 'whatsapp').length },
        { label: 'Reuniões', description: 'Contatos consultivos', getValue: (items) => items.filter((item) => item.channel === 'reuniao').length },
        { label: 'Com próximo passo', description: 'Ações mapeadas', getValue: (items) => items.filter((item) => item.nextStep).length },
      ]}
      primaryAction="Registrar interação"
    />
  );
}

export default Interacoes;
