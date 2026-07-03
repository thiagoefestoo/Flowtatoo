import { useEffect, useState } from 'react';

import { apiRequest } from '../services/api';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function formatTime(value) {
  return String(value || '').slice(0, 5) || '--:--';
}

function TattooDashboard() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('');

  async function loadSummary() {
    try {
      const result = await apiRequest('/tattoo-dashboard/summary');
      setSummary(result.data);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar dashboard.');
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const counters = summary?.counters || {};
  const cards = [
    { label: 'Hoje', value: counters.appointmentsToday || 0, description: 'horários marcados para hoje' },
    { label: 'Amanhã', value: counters.appointmentsTomorrow || 0, description: 'preparação da próxima agenda' },
    { label: 'Próximos 7 dias', value: counters.next7Days || 0, description: 'sessões e avaliações futuras' },
    { label: 'Confirmações pendentes', value: counters.pendingConfirmations || 0, description: 'clientes para chamar no WhatsApp' },
    { label: 'Pagamento aberto', value: counters.pendingDeposits || 0, description: 'sinal/saldo pendente' },
    { label: 'Recebido mês', value: formatMoney(counters.paidMonth), description: 'dinheiro já recebido' },
    { label: 'A receber', value: formatMoney(counters.openBalanceMonth), description: 'saldo ainda aberto' },
    { label: 'Pagos total', value: counters.fullyPaidMonth || 0, description: 'serviços quitados' },
  ];

  return (
    <div className="tattoo-page">
      <section className="tattoo-hero">
        <div>
          <span>MEU ESTÚDIO HOJE</span>
          <h1>Painel do seu dia</h1>
          <p>Resumo rápido para abrir no celular: agenda do dia, confirmações, sinais pendentes, próximos horários e faturamento finalizado.</p>
        </div>
        <div className="tattoo-hero-actions">
          <button type="button" className="tattoo-btn ghost" onClick={loadSummary}>Atualizar</button>
        </div>
      </section>

      {message && <div className="tattoo-message">{message}</div>}

      <section className="tattoo-kpi-row dashboard tattoo-dashboard-compact">
        {cards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="tattoo-panel">
        <div className="tattoo-panel-title">
          <span>Próximos horários</span>
          <strong>Agenda operacional</strong>
        </div>
        <div className="tattoo-card-list">
          {(summary?.nextAppointments || []).map((item) => (
            <article className="tattoo-list-card agenda" key={item.id}>
              <div>
                <strong>{formatDate(item.appointmentDate)} às {formatTime(item.startTime)} — {item.title}</strong>
                <span>{item.client?.name || 'Cliente'} · {item.artist?.name || 'Artista'}</span>
                <p>{item.status?.replaceAll('_', ' ')} · {item.confirmationStatus?.replaceAll('_', ' ')}</p>
                <p>Pagamento: {item.paymentStatus?.replaceAll('_', ' ')} · recebido {formatMoney(item.paidAmount)} de {formatMoney(item.price)}</p>
              </div>
            </article>
          ))}
          {(!summary?.nextAppointments || summary.nextAppointments.length === 0) && (
            <div className="tattoo-empty-day"><strong>Nenhum horário futuro.</strong><p>Cadastre novos horários na agenda.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}

export default TattooDashboard;
