import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiRequest } from '../services/api';
import { saveSession } from '../services/auth';

const FALLBACK_FLOW = {
  counters: { appointmentsToday: 0, appointmentsTomorrow: 0, clients: 0, artists: 0 },
  cards: {
    priority: { label: 'Agenda de hoje', title: '0 horários', detail: 'Tattoos e avaliações marcadas para hoje' },
    next: { label: 'Amanhã', title: '0 horários', detail: 'Prepare confirmação, materiais e bancada' },
  },
};

function formatCounter(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@flowtatoo.com');
  const [password, setPassword] = useState('Admin@12345');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(FALLBACK_FLOW);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const result = await apiRequest('/tattoo-dashboard/public-summary', { skipAuth: true });
        if (isMounted) {
          setSummary(result.data || FALLBACK_FLOW);
          setOnline(true);
        }
      } catch (error) {
        if (isMounted) {
          setSummary(FALLBACK_FLOW);
          setOnline(false);
        }
      }
    }

    loadSummary();
    const interval = window.setInterval(loadSummary, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const counters = summary?.counters || FALLBACK_FLOW.counters;
  const cards = summary?.cards || FALLBACK_FLOW.cards;

  const flowSteps = useMemo(
    () => [
      { value: counters.appointmentsToday, label: 'Hoje', meta: 'horários marcados' },
      { value: counters.appointmentsTomorrow, label: 'Amanhã', meta: 'agenda futura' },
      { value: counters.clients, label: 'Clientes', meta: 'base cadastrada' },
      { value: counters.artists, label: 'Meu perfil', meta: 'artista ativo' },
    ],
    [counters]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: email.trim(), password }),
      });

      saveSession({ token: result.data.token, user: result.data.user });
      navigate('/');
    } catch (error) {
      setMessage(error.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page fp-login-page">
      <section className="fp-login-visual">
        <div className="fp-login-logo">
          <span>FT</span>
          <div>
            <strong>Flowtatoo</strong>
            <small>Agenda pessoal no celular</small>
          </div>
        </div>

        <div className="fp-login-headline">
          <span>Seu estúdio no celular</span>
          <h1>Controle sua agenda, seus clientes e seus horários direto do celular.</h1>
          <p>
            Um app leve para o dono do estúdio controlar horários marcados, confirmações pelo WhatsApp, sinais pendentes, clientes e histórico de atendimentos.
          </p>
        </div>

        <div className="fp-login-lower-grid">
          <div className="fp-ops-board">
            <div className="fp-ops-board-top">
              <div>
                <small>MEU DIA</small>
                <strong>Calendário pessoal do estúdio</strong>
              </div>
              <span>{online ? 'ao vivo' : 'online'}</span>
            </div>

            <div className="fp-ops-steps">
              {flowSteps.map((step, index) => (
                <div key={step.label}>
                  <b>{formatCounter(step.value)}</b>
                  <span>{step.label}</span>
                  <em>{step.meta}</em>
                  {index < flowSteps.length - 1 && <i />}
                </div>
              ))}
            </div>

            <div className="fp-ops-stats">
              <article>
                <small>Clientes cadastrados</small>
                <strong>{formatCounter(counters.clients)}</strong>
                <span>base do estúdio</span>
              </article>
              <article>
                <small>Perfil artístico</small>
                <strong>{formatCounter(counters.artists)}</strong>
                <span>seu cadastro profissional</span>
              </article>
              <article>
                <small>Horários hoje</small>
                <strong>{formatCounter(counters.appointmentsToday)}</strong>
                <span>agenda do dia</span>
              </article>
            </div>
          </div>

          <aside className="fp-side-cards" aria-label="Resumo RH">
            <div className="fp-floating-card fp-floating-card-a">
              <small>{cards.priority?.label}</small>
              <strong>{cards.priority?.title}</strong>
              <span>{cards.priority?.detail}</span>
            </div>
            <div className="fp-floating-card fp-floating-card-b">
              <small>{cards.next?.label}</small>
              <strong>{cards.next?.title}</strong>
              <span>{cards.next?.detail}</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="login-panel fp-login-panel">
        <div className="login-brand fp-login-brand">
          <span>Portal seguro</span>
          <strong>Acesso do dono</strong>
        </div>
        <div className="login-copy fp-login-copy">
          <p>Flowtatoo pessoal</p>
          <h1>Acesse seu estúdio.</h1>
          <span>Entre para acompanhar agenda, clientes, sinais pendentes, alertas, histórico e BI do seu estúdio.</span>
        </div>

        {message && <div className="login-message">{message}</div>}

        <form className="login-form fp-login-form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@flowtatoo.com" required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" required />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Validando acesso...' : 'Acessar sistema'}</button>
        </form>
      </section>
    </main>
  );
}

export default Login;
