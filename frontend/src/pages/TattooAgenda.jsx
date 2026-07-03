import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { apiRequest, extractData } from '../services/api';

const EMPTY_FORM = {
  clientId: '',
  artistId: '',
  title: '',
  serviceType: 'tattoo',
  style: '',
  bodyArea: '',
  sizeLabel: '',
  appointmentDate: '',
  startTime: '09:00',
  estimatedMinutes: 120,
  price: '',
  deposit: '',
  paidAmount: '',
  paymentMethod: 'nao_informado',
  paymentStatus: 'pendente',
  paymentNotes: '',
  status: 'agendado',
  confirmationStatus: 'nao_enviado',
  reminderMinutesBefore: 1440,
  priority: 'normal',
  notes: '',
};

const SERVICE_LABELS = {
  orcamento: 'Orçamento',
  tattoo: 'Tattoo',
  retoque: 'Retoque',
  avaliacao: 'Avaliação',
  remocao: 'Remoção',
  piercing: 'Piercing',
  outro: 'Outro',
};

const STATUS_LABELS = {
  orcamento: 'Orçamento',
  aguardando_sinal: 'Aguardando sinal',
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  reagendado: 'Reagendado',
};

const CONFIRMATION_LABELS = {
  nao_enviado: 'Não enviado',
  aguardando_cliente: 'Aguardando cliente',
  confirmado: 'Confirmado',
  sem_resposta: 'Sem resposta',
};

const PAYMENT_STATUS_LABELS = {
  pendente: 'Não pagou',
  sinal_pago: 'Sinal pago',
  parcial: 'Pagou parte',
  pago: 'Pago total',
  cancelado: 'Cancelado',
};

const PAYMENT_METHOD_LABELS = {
  nao_informado: 'Não informado',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  transferencia: 'Transferência',
  outro: 'Outro',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISODate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, options = {}) {
  if (!value) return '-';
  return parseISODate(value).toLocaleDateString('pt-BR', options);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTime(value) {
  if (!value) return '--:--';
  return String(value).slice(0, 5);
}

function getMonthRange(monthReference) {
  const date = parseISODate(monthReference);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

function buildMonthDays(monthReference) {
  const date = parseISODate(monthReference);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days = [];

  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push(toISODate(new Date(date.getFullYear(), date.getMonth(), day)));
  }

  return days;
}

function sanitizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function getPaymentStatus({ price, paidAmount, deposit, paymentStatus }) {
  const total = toNumber(price);
  const paid = toNumber(paidAmount);
  const signal = toNumber(deposit);

  if (paymentStatus === 'cancelado') return 'cancelado';
  if (total > 0 && paid >= total) return 'pago';
  if (paid > 0 && paid > signal) return 'parcial';
  if (paid > 0 || signal > 0) return 'sinal_pago';
  return 'pendente';
}

function getPaymentSummary(item) {
  const price = toNumber(item?.price);
  const paidAmount = toNumber(item?.paidAmount);
  const deposit = toNumber(item?.deposit);
  const status = getPaymentStatus({ price, paidAmount, deposit, paymentStatus: item?.paymentStatus });
  const remaining = Math.max(price - paidAmount, 0);
  const percent = price > 0 ? Math.min(100, Math.round((paidAmount / price) * 100)) : 0;

  return { price, paidAmount, deposit, remaining, percent, status };
}

function TattooAgenda() {
  const today = toISODate(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const handledAppointmentRef = useRef('');
  const requestedDate = searchParams.get('date');
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') ? requestedDate : today;
  const [selectedMonth, setSelectedMonth] = useState(initialDate.slice(0, 8) + '01');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [artists, setArtists] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadBase() {
    const [clientResult, artistResult] = await Promise.all([
      apiRequest('/tattoo-clients'),
      apiRequest('/tattoo-artists'),
    ]);
    setClients(extractData(clientResult));
    setArtists(extractData(artistResult));
  }

  async function loadAppointments() {
    const { startDate, endDate } = getMonthRange(selectedMonth);
    const result = await apiRequest(`/tattoo-appointments?startDate=${startDate}&endDate=${endDate}`);
    setAppointments(extractData(result));
  }

  async function loadSummary() {
    const result = await apiRequest('/tattoo-dashboard/summary');
    setSummary(result.data);
  }

  async function refreshAll() {
    setMessage('');
    try {
      setLoading(true);
      await Promise.all([loadBase(), loadAppointments(), loadSummary()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [selectedMonth]);

  useEffect(() => {
    const date = searchParams.get('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return;
    setSelectedDate(date);
    setSelectedMonth(date.slice(0, 8) + '01');
  }, [searchParams]);

  useEffect(() => {
    const appointmentId = searchParams.get('appointment');
    if (!appointmentId || handledAppointmentRef.current === appointmentId) return;
    const item = appointments.find((appointment) => appointment.id === appointmentId);
    if (!item) return;

    handledAppointmentRef.current = appointmentId;
    setSelectedDate(item.appointmentDate);
    openEdit(item);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('appointment');
    setSearchParams(nextParams, { replace: true });
  }, [appointments, searchParams, setSearchParams]);

  const monthDays = useMemo(() => buildMonthDays(selectedMonth), [selectedMonth]);

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc, item) => {
      const key = item.appointmentDate;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [appointments]);

  const selectedAppointments = useMemo(() => {
    return [...(appointmentsByDate[selectedDate] || [])].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }, [appointmentsByDate, selectedDate]);

  const formPayment = useMemo(() => getPaymentSummary(form), [form]);

  const alertItems = useMemo(() => {
    const futureActive = appointments.filter((item) => item.appointmentDate >= today && !['cancelado', 'finalizado'].includes(item.status));
    const todayItems = futureActive.filter((item) => item.appointmentDate === today);
    const notConfirmed = futureActive.filter((item) => item.confirmationStatus !== 'confirmado');
    const depositPending = futureActive.filter((item) => ['pendente', 'sinal_pago', 'parcial'].includes(getPaymentSummary(item).status) || item.status === 'aguardando_sinal');
    const urgent = futureActive.filter((item) => item.priority === 'alta' || item.priority === 'urgente');

    return [
      { type: 'danger', title: 'Horários de hoje', value: todayItems.length, text: 'Atendimentos que precisam de bancada, material e confirmação rápida.' },
      { type: 'warning', title: 'Confirmação pendente', value: notConfirmed.length, text: 'Clientes ainda sem confirmação no calendário.' },
      { type: 'info', title: 'Pagamento aberto', value: depositPending.length, text: 'Sinal, parcela ou saldo final ainda pendente.' },
      { type: 'success', title: 'Prioridade alta', value: urgent.length, text: 'Sessões importantes para acompanhar de perto.' },
    ];
  }, [appointments, today]);

  function previousMonth() {
    const current = parseISODate(selectedMonth);
    const next = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    setSelectedMonth(toISODate(next));
    setSelectedDate(toISODate(next));
  }

  function nextMonth() {
    const current = parseISODate(selectedMonth);
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    setSelectedMonth(toISODate(next));
    setSelectedDate(toISODate(next));
  }

  function goToday() {
    setSelectedMonth(today.slice(0, 8) + '01');
    setSelectedDate(today);
  }

  function openNew(date = selectedDate) {
    setEditing(null);
    setForm({ ...EMPTY_FORM, appointmentDate: date, artistId: artists.length === 1 ? artists[0].id : '' });
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      clientId: item.clientId || '',
      artistId: item.artistId || '',
      title: item.title || '',
      serviceType: item.serviceType || 'tattoo',
      style: item.style || '',
      bodyArea: item.bodyArea || '',
      sizeLabel: item.sizeLabel || '',
      appointmentDate: item.appointmentDate || selectedDate,
      startTime: formatTime(item.startTime),
      estimatedMinutes: item.estimatedMinutes || 120,
      price: item.price || '',
      deposit: item.deposit || '',
      paidAmount: item.paidAmount || item.deposit || '',
      paymentMethod: item.paymentMethod || 'nao_informado',
      paymentStatus: item.paymentStatus || 'pendente',
      paymentNotes: item.paymentNotes || '',
      status: item.status || 'agendado',
      confirmationStatus: item.confirmationStatus || 'nao_enviado',
      reminderMinutesBefore: item.reminderMinutesBefore || 1440,
      priority: item.priority || 'normal',
      notes: item.notes || '',
    });
    setModalOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (['price', 'deposit', 'paidAmount'].includes(name)) {
        next.paymentStatus = getPaymentStatus(next);
      }
      return next;
    });
  }

  function applyPaymentShortcut(type) {
    setForm((current) => {
      const price = toNumber(current.price);
      const deposit = toNumber(current.deposit);
      if (type === 'sinal') {
        const signal = deposit || Math.min(price, 100);
        return { ...current, deposit: signal || '', paidAmount: signal || '', paymentStatus: 'sinal_pago' };
      }
      if (type === 'metade') {
        const half = price ? Number((price / 2).toFixed(2)) : toNumber(current.paidAmount);
        return { ...current, paidAmount: half || '', paymentStatus: getPaymentStatus({ ...current, paidAmount: half }) };
      }
      if (type === 'total') {
        return { ...current, paidAmount: price || current.paidAmount || '', paymentStatus: price ? 'pago' : 'pago' };
      }
      return { ...current, paidAmount: '', deposit: '', paymentStatus: 'pendente' };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const paymentStatus = getPaymentStatus(form);
      const payload = {
        ...form,
        estimatedMinutes: Number(form.estimatedMinutes || 120),
        reminderMinutesBefore: Number(form.reminderMinutesBefore || 1440),
        price: form.price === '' ? null : Number(form.price),
        deposit: form.deposit === '' ? null : Number(form.deposit),
        paidAmount: form.paidAmount === '' ? 0 : Number(form.paidAmount),
        paymentStatus,
      };

      if (editing) {
        await apiRequest(`/tattoo-appointments/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/tattoo-appointments', { method: 'POST', body: JSON.stringify(payload) });
      }

      setModalOpen(false);
      await refreshAll();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar agendamento.');
    }
  }

  async function quickStatus(item, payload) {
    try {
      await apiRequest(`/tattoo-appointments/${item.id}/status`, { method: 'PATCH', body: JSON.stringify(payload) });
      await refreshAll();
    } catch (error) {
      setMessage(error.message || 'Erro ao atualizar status.');
    }
  }

  async function markPaid(item) {
    const price = toNumber(item.price);
    await quickStatus(item, { paymentStatus: 'pago', paidAmount: price, paymentMethod: item.paymentMethod || 'pix' });
  }

  function whatsappLink(item) {
    const phone = sanitizePhone(item.client?.whatsapp || item.client?.phone);
    if (!phone) return '#';
    const payment = getPaymentSummary(item);
    const paymentText = payment.remaining > 0 ? `Saldo em aberto: ${formatMoney(payment.remaining)}.` : 'Pagamento registrado como quitado.';
    const text = `Olá, ${item.client?.name || ''}! Passando para confirmar seu horário no estúdio: ${formatDate(item.appointmentDate)} às ${formatTime(item.startTime)}. Serviço: ${item.title}. ${paymentText}`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
  }

  const monthLabel = parseISODate(selectedMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="tattoo-page tattoo-agenda-page">
      <section className="tattoo-hero tattoo-hero-compact">
        <div>
          <span>FLOWTATOO AGENDA</span>
          <h1>Calendário do meu estúdio</h1>
          <p>Controle horários, confirmação, sinal, pagamento parcial e pagamento total direto pelo celular.</p>
        </div>
        <div className="tattoo-hero-actions">
          <button type="button" className="tattoo-btn ghost" onClick={goToday}>Hoje</button>
          <button type="button" className="tattoo-btn primary" onClick={() => openNew()}>+ Novo horário</button>
        </div>
      </section>

      {message && <div className="tattoo-message">{message}</div>}

      <section className="tattoo-kpi-row dashboard tattoo-dashboard-compact">
        <article><span>Hoje</span><strong>{summary?.counters?.appointmentsToday || 0}</strong><p>horários</p></article>
        <article><span>A receber</span><strong>{formatMoney(summary?.counters?.openBalanceMonth || 0)}</strong><p>saldo do mês</p></article>
        <article><span>Recebido</span><strong>{formatMoney(summary?.counters?.paidMonth || 0)}</strong><p>pagamentos</p></article>
        <article><span>Parciais</span><strong>{summary?.counters?.partialPayments || 0}</strong><p>sinal/parte</p></article>
      </section>

      <section className="tattoo-alert-grid tattoo-alert-grid-compact">
        {alertItems.map((item) => (
          <article className={`tattoo-alert ${item.type}`} key={item.title}>
            <div><span>{item.title}</span><strong>{item.value}</strong></div>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="tattoo-calendar-shell">
        <div className="tattoo-calendar-main">
          <div className="tattoo-calendar-toolbar">
            <button type="button" onClick={previousMonth}>‹</button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={nextMonth}>›</button>
          </div>

          <div className="tattoo-month-grid">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span className="tattoo-weekday" key={`${day}-${index}`}>{day}</span>)}
            {Array.from({ length: parseISODate(monthDays[0]).getDay() }).map((_, index) => <i key={`blank-${index}`} />)}
            {monthDays.map((day) => {
              const count = appointmentsByDate[day]?.length || 0;
              const isActive = day === selectedDate;
              const isToday = day === today;
              return (
                <button type="button" key={day} className={`tattoo-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDate(day)}>
                  <b>{parseISODate(day).getDate()}</b>
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="tattoo-day-panel">
          <div className="tattoo-day-panel-head">
            <div>
              <span>Dia selecionado</span>
              <strong>{formatDate(selectedDate, { weekday: 'long', day: '2-digit', month: 'long' })}</strong>
            </div>
            <button type="button" onClick={() => openNew(selectedDate)}>+</button>
          </div>

          <div className="tattoo-timeline">
            {selectedAppointments.map((item) => {
              const payment = getPaymentSummary(item);
              return (
                <article className={`tattoo-slot ${item.status} payment-${payment.status}`} key={item.id}>
                  <div className="tattoo-slot-time">
                    <strong>{formatTime(item.startTime)}</strong>
                    <span>{formatTime(item.endTime)}</span>
                  </div>
                  <div className="tattoo-slot-body">
                    <div className="tattoo-slot-title">
                      <strong>{item.title}</strong>
                      <span>{STATUS_LABELS[item.status] || item.status}</span>
                    </div>
                    <p>{item.client?.name || 'Cliente não informado'} • {item.artist?.name || 'Meu perfil'}</p>
                    <small>{SERVICE_LABELS[item.serviceType] || item.serviceType} · {item.style || 'estilo livre'} · {item.bodyArea || 'local a definir'}</small>
                    <div className="tattoo-slot-payment">
                      <div>
                        <span>{PAYMENT_STATUS_LABELS[payment.status]}</span>
                        <strong>{formatMoney(payment.paidAmount)} / {formatMoney(payment.price)}</strong>
                      </div>
                      <i><b style={{ width: `${payment.percent}%` }} /></i>
                      <small>{payment.remaining > 0 ? `Falta ${formatMoney(payment.remaining)}` : 'Quitado'}</small>
                    </div>
                    <div className="tattoo-slot-meta">
                      <em>{CONFIRMATION_LABELS[item.confirmationStatus] || item.confirmationStatus}</em>
                      <em>{PAYMENT_METHOD_LABELS[item.paymentMethod] || 'Forma não informada'}</em>
                    </div>
                    <div className="tattoo-slot-actions">
                      <button type="button" onClick={() => openEdit(item)}>Detalhes</button>
                      <a href={whatsappLink(item)} target="_blank" rel="noreferrer">WhatsApp</a>
                      <button type="button" onClick={() => quickStatus(item, { status: 'confirmado', confirmationStatus: 'confirmado' })}>Confirmar</button>
                      {payment.status !== 'pago' && <button type="button" onClick={() => markPaid(item)}>Pago total</button>}
                    </div>
                  </div>
                </article>
              );
            })}
            {selectedAppointments.length === 0 && (
              <div className="tattoo-empty-day">
                <strong>Nenhum horário neste dia.</strong>
                <p>Toque em “+” para agendar uma tattoo, avaliação ou retoque.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      {modalOpen && (
        <div className="tattoo-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}>
          <form className="tattoo-modal tattoo-modal-mobile" onSubmit={handleSubmit}>
            <div className="tattoo-modal-head">
              <div>
                <span>{editing ? 'Editar horário' : 'Novo horário'}</span>
                <strong>{editing ? editing.title : 'Agendamento do estúdio'}</strong>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="tattoo-form-grid">
              <label>Cliente cadastrado
                <select name="clientId" value={form.clientId} onChange={handleChange} required>
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone}</option>)}
                </select>
              </label>
              <label>Artista / meu perfil
                <select name="artistId" value={form.artistId} onChange={handleChange} required>
                  <option value="">Selecione seu perfil artístico</option>
                  {artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name} · {artist.specialties || 'geral'}</option>)}
                </select>
              </label>
              <label>Título
                <input name="title" value={form.title} onChange={handleChange} placeholder="Ex.: Tattoo fineline no antebraço" required />
              </label>
              <label>Tipo
                <select name="serviceType" value={form.serviceType} onChange={handleChange}>
                  {Object.entries(SERVICE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Data
                <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} required />
              </label>
              <label>Hora
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
              </label>
              <label>Duração em minutos
                <input type="number" min="30" step="15" name="estimatedMinutes" value={form.estimatedMinutes} onChange={handleChange} />
              </label>
              <label>Prioridade
                <select name="priority" value={form.priority} onChange={handleChange}>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>
              <label>Estilo
                <input name="style" value={form.style} onChange={handleChange} placeholder="fineline, blackwork, realismo..." />
              </label>
              <label>Local do corpo
                <input name="bodyArea" value={form.bodyArea} onChange={handleChange} placeholder="braço, costela, perna..." />
              </label>
              <label>Tamanho
                <input name="sizeLabel" value={form.sizeLabel} onChange={handleChange} placeholder="pequena, média, fechamento..." />
              </label>

              <div className="tattoo-payment-box tattoo-form-full">
                <div className="tattoo-payment-box-head">
                  <div>
                    <span>Pagamento</span>
                    <strong>{PAYMENT_STATUS_LABELS[formPayment.status]}</strong>
                  </div>
                  <small>{formPayment.remaining > 0 ? `Falta ${formatMoney(formPayment.remaining)}` : 'Sem saldo aberto'}</small>
                </div>
                <div className="tattoo-payment-progress"><b style={{ width: `${formPayment.percent}%` }} /></div>
                <div className="tattoo-payment-shortcuts">
                  <button type="button" onClick={() => applyPaymentShortcut('sinal')}>Sinal pago</button>
                  <button type="button" onClick={() => applyPaymentShortcut('metade')}>Pagou parte</button>
                  <button type="button" onClick={() => applyPaymentShortcut('total')}>Pagou tudo</button>
                  <button type="button" onClick={() => applyPaymentShortcut('limpar')}>Limpar</button>
                </div>
              </div>

              <label>Valor total
                <input type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} placeholder="Valor combinado" />
              </label>
              <label>Sinal / adiantamento
                <input type="number" min="0" step="0.01" name="deposit" value={form.deposit} onChange={handleChange} placeholder="Quanto adiantou" />
              </label>
              <label>Total já pago
                <input type="number" min="0" step="0.01" name="paidAmount" value={form.paidAmount} onChange={handleChange} placeholder="Valor já recebido" />
              </label>
              <label>Forma de pagamento
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Status do pagamento
                <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Status da agenda
                <select name="status" value={form.status} onChange={handleChange}>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Confirmação
                <select name="confirmationStatus" value={form.confirmationStatus} onChange={handleChange}>
                  {Object.entries(CONFIRMATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="tattoo-form-full">Observações de pagamento
                <textarea name="paymentNotes" value={form.paymentNotes} onChange={handleChange} placeholder="Ex.: sinal via Pix, restante no dia, parcelamento, comprovante enviado..." />
              </label>
              <label className="tattoo-form-full">Observações do atendimento
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Referências, cuidados, materiais, observações do cliente..." />
              </label>
            </div>

            <div className="tattoo-modal-actions">
              <button type="button" className="tattoo-btn ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="tattoo-btn primary">Salvar horário</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="tattoo-loading">Atualizando agenda...</div>}
    </div>
  );
}

export default TattooAgenda;
