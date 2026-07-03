import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const initialForm = {
  name: '',
  email: '',
  password: '',
  status: 'ativo',
  notes: '',
};

const deliveryStatusLabels = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  recebida: 'Recebida',
  em_rota: 'Em rota',
  entregue: 'Entregue',
  nao_entregue: 'Não entregue',
  cancelada: 'Cancelada',
};

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getDeliveryStatusClass(status) {
  return `status-badge crm-status-${String(status || 'pendente').replaceAll('_', '-')}`;
}

function getDeliveryAddress(delivery) {
  return [
    delivery.address,
    delivery.number,
    delivery.complement,
    delivery.district,
    delivery.city,
    delivery.state,
  ]
    .filter(Boolean)
    .join(', ');
}

function Entregadores() {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [detailModal, setDetailModal] = useState({
    open: false,
    driver: null,
    deliveries: [],
    loading: false,
    error: '',
  });

  async function loadDrivers() {
    try {
      const params = new URLSearchParams({ role: 'entregador' });
      if (filters.q) params.set('q', filters.q);
      if (filters.status) params.set('status', filters.status);
      const result = await apiRequest(`/users?${params.toString()}`);
      setDrivers(extractData(result));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleEdit(driver) {
    setEditingId(driver.id);
    setForm({
      name: driver.name || '',
      email: driver.email || '',
      password: '',
      status: driver.status || 'ativo',
      notes: driver.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleViewDetails(driver) {
    setDetailModal({
      open: true,
      driver,
      deliveries: [],
      loading: true,
      error: '',
    });

    try {
      const result = await apiRequest(`/deliveries?driverId=${driver.id}`);
      setDetailModal({
        open: true,
        driver,
        deliveries: extractData(result),
        loading: false,
        error: '',
      });
    } catch (error) {
      setDetailModal({
        open: true,
        driver,
        deliveries: [],
        loading: false,
        error: error.message,
      });
    }
  }

  function closeDetails() {
    setDetailModal({
      open: false,
      driver: null,
      deliveries: [],
      loading: false,
      error: '',
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        role: 'entregador',
      };

      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await apiRequest(`/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMessage('Entregador atualizado com sucesso.');
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Entregador cadastrado com sucesso.');
      }

      resetForm();
      await loadDrivers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadDrivers();
  }

  async function handleDisable(driverId) {
    try {
      await apiRequest(`/users/${driverId}`, { method: 'DELETE' });
      setMessage('Entregador inativado com sucesso.');
      await loadDrivers();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const activeCount = drivers.filter((item) => item.status === 'ativo').length;
  const detailDeliveries = detailModal.deliveries || [];
  const activeDeliveries = detailDeliveries.filter((delivery) => !['entregue', 'cancelada'].includes(delivery.status));
  const deliveredCount = detailDeliveries.filter((delivery) => delivery.status === 'entregue').length;
  const sentCount = detailDeliveries.filter((delivery) => delivery.status === 'enviada').length;
  const inRouteCount = detailDeliveries.filter((delivery) => delivery.status === 'em_rota').length;

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Base operacional</span>
          <h1>Entregadores</h1>
          <p>Cadastre acessos mobile para os entregadores, controle status e mantenha a operação organizada.</p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{drivers.length}</strong>
          <p>entregadores cadastrados</p>
        </article>
        <article>
          <span>Ativos</span>
          <strong>{activeCount}</strong>
          <p>aptos para receber entregas</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{editingId ? 'Editar entregador' : 'Novo entregador'}</h2>
            <p>{editingId ? 'Deixe a senha em branco para manter a atual.' : 'Crie um novo acesso mobile para a equipe.'}</p>
          </div>

          {editingId && (
            <button className="ghost-button" type="button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Nome *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            E-mail *
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Senha {editingId ? '' : '*'}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!editingId}
              placeholder={editingId ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
            />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </label>

          <label className="form-full">
            Observações
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar entregador' : 'Cadastrar entregador'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Equipe cadastrada</h2>
            <p>Localize e gerencie os acessos disponíveis para o campo.</p>
          </div>

          <form className="filters" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Buscar entregador"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            />
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">Status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
            <button type="submit">Filtrar</button>
          </form>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{driver.email}</td>
                  <td>
                    <span className={`status-badge crm-status-${String(driver.status || 'ativo').replaceAll('_', '-')}`}>{driver.status}</span>
                  </td>
                  <td>{driver.lastLoginAt ? new Date(driver.lastLoginAt).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    <div className="table-actions crm-table-actions-expanded">
                      <button type="button" className="details-button" onClick={() => handleViewDetails(driver)}>Detalhes</button>
                      <button type="button" onClick={() => handleEdit(driver)}>Editar</button>
                      <button type="button" className="danger-button" onClick={() => handleDisable(driver.id)}>Inativar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-table">Nenhum entregador encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailModal.open && detailModal.driver && (
        <div
          className="record-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do entregador ${detailModal.driver.name}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <article className="record-modal-card driver-detail-modal-card">
            <header className="record-modal-header">
              <div>
                <span>Detalhes do entregador</span>
                <h2>{detailModal.driver.name}</h2>
                <p>Resumo do cadastro, acesso e entregas vinculadas ao entregador.</p>
              </div>
              <button type="button" onClick={closeDetails} aria-label="Fechar">×</button>
            </header>

            <div className="record-detail-grid">
              <div className="record-detail-item">
                <small>Nome</small>
                <strong>{detailModal.driver.name || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>E-mail</small>
                <strong>{detailModal.driver.email || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Status</small>
                <strong>{detailModal.driver.status || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Perfil</small>
                <strong>{detailModal.driver.role || '-'}</strong>
              </div>
              <div className="record-detail-item">
                <small>Último acesso</small>
                <strong>{formatDateTime(detailModal.driver.lastLoginAt)}</strong>
              </div>
              <div className="record-detail-item">
                <small>Cadastrado em</small>
                <strong>{formatDateTime(detailModal.driver.createdAt)}</strong>
              </div>
              <div className="record-detail-item full">
                <small>Observações</small>
                <strong>{detailModal.driver.notes || 'Sem observações cadastradas.'}</strong>
              </div>
            </div>

            <section className="driver-box-modal-kpis driver-detail-kpis">
              <article>
                <span>Total vinculadas</span>
                <strong>{detailDeliveries.length}</strong>
              </article>
              <article>
                <span>Na caixa</span>
                <strong>{activeDeliveries.length}</strong>
              </article>
              <article>
                <span>Aguardando aceite</span>
                <strong>{sentCount}</strong>
              </article>
              <article>
                <span>Em rota</span>
                <strong>{inRouteCount}</strong>
              </article>
              <article>
                <span>Entregues</span>
                <strong>{deliveredCount}</strong>
              </article>
            </section>

            {detailModal.loading && <div className="module-message">Carregando entregas do entregador...</div>}
            {detailModal.error && <div className="module-message error">{detailModal.error}</div>}

            {!detailModal.loading && !detailModal.error && (
              <div className="driver-box-modal-list driver-detail-delivery-list">
                {detailDeliveries.map((delivery) => (
                  <article className="driver-box-modal-delivery" key={delivery.id}>
                    <div className="driver-box-modal-delivery-head">
                      <div>
                        <small>{delivery.orderNumber || 'Pedido sem número'} · {delivery.document || 'Sem documento'}</small>
                        <h3>{delivery.title}</h3>
                        <p>{delivery.customer?.name || 'Cliente não informado'}</p>
                      </div>
                      <span className={getDeliveryStatusClass(delivery.status)}>
                        {deliveryStatusLabels[delivery.status] || delivery.status || '-'}
                      </span>
                    </div>

                    <div className="driver-box-modal-delivery-grid">
                      <span><strong>Destinatário:</strong> {delivery.recipientName || '-'}</span>
                      <span><strong>Previsão:</strong> {formatDateTime(delivery.scheduledDate)}</span>
                      <span><strong>Endereço:</strong> {getDeliveryAddress(delivery) || '-'}</span>
                      <span><strong>Prioridade:</strong> {delivery.priority || '-'}</span>
                      <span><strong>Taxa:</strong> {formatCurrency(delivery.deliveryFee)}</span>
                      <span><strong>Criada em:</strong> {formatDateTime(delivery.createdAt)}</span>
                    </div>

                    {Array.isArray(delivery.items) && delivery.items.length > 0 && (
                      <div className="driver-box-modal-items">
                        {delivery.items.map((item) => (
                          <span key={item.id || item.productId}>
                            {Number(item.quantity || 0)}x {item.product?.name || item.description || 'Produto'}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}

                {detailDeliveries.length === 0 && (
                  <div className="empty-table driver-detail-empty">
                    Nenhuma entrega vinculada a este entregador até o momento.
                  </div>
                )}
              </div>
            )}

            <footer className="record-modal-footer">
              <button type="button" onClick={closeDetails}>Fechar</button>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}

export default Entregadores;
