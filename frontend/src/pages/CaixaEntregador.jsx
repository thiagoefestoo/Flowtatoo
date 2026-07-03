import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const ACTIVE_STATUSES = ['pendente', 'enviada', 'recebida', 'em_rota', 'nao_entregue'];

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR');
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getDeliveryAddress(delivery) {
  return [delivery.address, delivery.number, delivery.district, delivery.city, delivery.state]
    .filter(Boolean)
    .join(', ');
}

function getDeliveryStatusClass(status) {
  return `status-badge crm-status-${String(status || 'pendente').replaceAll('_', '-')}`;
}

function CaixaEntregador() {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [filters, setFilters] = useState({ q: '', driverId: '', status: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState('');
  const [openDriverBoxId, setOpenDriverBoxId] = useState('');

  async function loadData() {
    setLoading(true);
    setMessage('');

    try {
      const [deliveriesResult, driversResult] = await Promise.all([
        apiRequest('/deliveries'),
        apiRequest('/users?role=entregador&status=ativo'),
      ]);

      const loadedDeliveries = extractData(deliveriesResult);
      const loadedDrivers = extractData(driversResult);

      setDeliveries(loadedDeliveries);
      setDrivers(loadedDrivers);

      setSelectedDrivers((current) => {
        const next = { ...current };

        loadedDeliveries.forEach((delivery) => {
          if (!next[delivery.id] && delivery.driverId) {
            next[delivery.id] = delivery.driverId;
          }
        });

        return next;
      });
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar entregas e entregadores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeDeliveries = useMemo(
    () => deliveries.filter((delivery) => ACTIVE_STATUSES.includes(delivery.status)),
    [deliveries]
  );

  const filteredDeliveries = useMemo(() => {
    const search = normalizeText(filters.q);

    return activeDeliveries.filter((delivery) => {
      const content = normalizeText([
        delivery.orderNumber,
        delivery.title,
        delivery.document,
        delivery.customer?.name,
        delivery.driver?.name,
        delivery.city,
        delivery.address,
        delivery.status,
      ].filter(Boolean).join(' '));

      const matchesSearch = !search || content.includes(search);
      const matchesDriver = !filters.driverId || delivery.driverId === filters.driverId;
      const matchesStatus = !filters.status || delivery.status === filters.status;

      return matchesSearch && matchesDriver && matchesStatus;
    });
  }, [activeDeliveries, filters]);

  const driverBoxes = useMemo(() => {
    return drivers.map((driver) => {
      const assigned = activeDeliveries.filter((delivery) => delivery.driverId === driver.id);

      return {
        driver,
        assigned,
        inRoute: assigned.filter((delivery) => delivery.status === 'em_rota').length,
        waiting: assigned.filter((delivery) => ['enviada', 'recebida'].includes(delivery.status)).length,
      };
    });
  }, [drivers, activeDeliveries]);

  const selectedDriverBox = useMemo(
    () => driverBoxes.find(({ driver }) => driver.id === openDriverBoxId) || null,
    [driverBoxes, openDriverBoxId]
  );

  const unassignedCount = activeDeliveries.filter((delivery) => !delivery.driverId).length;
  const sentCount = activeDeliveries.filter((delivery) => delivery.status === 'enviada').length;
  const inRouteCount = activeDeliveries.filter((delivery) => delivery.status === 'em_rota').length;

  function handleDriverSelection(deliveryId, driverId) {
    setSelectedDrivers((current) => ({ ...current, [deliveryId]: driverId }));
  }

  async function handleSendToDriver(delivery) {
    const driverId = selectedDrivers[delivery.id];

    if (!driverId) {
      setMessage('Selecione um entregador antes de enviar a entrega para a caixa.');
      return;
    }

    const driver = drivers.find((item) => item.id === driverId);
    setSendingId(delivery.id);
    setMessage('');

    try {
      const body = {
        driverId,
        driverNotes: `Entrega enviada para a caixa do entregador ${driver?.name || ''}.`,
      };

      const result = await apiRequest(`/deliveries/${delivery.id}/send-to-driver`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setMessage(result.message || 'Entrega enviada para a caixa do entregador.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao enviar entrega para a caixa do entregador.');
    } finally {
      setSendingId('');
    }
  }

  return (
    <div className="module-page driver-box-page">
      <div className="page-header">
        <div>
          <span>Despacho operacional</span>
          <h1>Caixa do entregador</h1>
          <p>
            Envie entregas já criadas para a caixa do entregador. Ao enviar, a entrega fica atribuída ao entregador,
            muda para o status enviada e aparece na tela Minhas entregas do smartphone.
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={loadData} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar caixas'}
        </button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Entregas ativas</span>
          <strong>{activeDeliveries.length}</strong>
          <p>pendentes, enviadas ou em rota</p>
        </article>
        <article>
          <span>Sem entregador</span>
          <strong>{unassignedCount}</strong>
          <p>aguardando despacho</p>
        </article>
        <article>
          <span>Na caixa</span>
          <strong>{sentCount}</strong>
          <p>enviadas ao entregador</p>
        </article>
        <article>
          <span>Em rota</span>
          <strong>{inRouteCount}</strong>
          <p>execução em campo</p>
        </article>
      </section>

      <section className="driver-dispatch-grid">
        <article className="list-panel driver-dispatch-panel">
          <div className="panel-title">
            <div>
              <h2>Enviar entregas</h2>
              <p>Selecione um entregador e envie a ordem de entrega para a caixa mobile dele.</p>
            </div>

            <div className="filters driver-dispatch-filters">
              <input
                type="search"
                placeholder="Buscar pedido, cliente, cidade ou endereço"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="enviada">Enviada</option>
                <option value="recebida">Recebida</option>
                <option value="em_rota">Em rota</option>
                <option value="nao_entregue">Não entregue</option>
              </select>
              <select value={filters.driverId} onChange={(event) => setFilters((current) => ({ ...current, driverId: event.target.value }))}>
                <option value="">Todos os entregadores</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="driver-dispatch-list">
            {filteredDeliveries.map((delivery) => (
              <article className="driver-dispatch-card" key={delivery.id}>
                <div className="driver-dispatch-card-main">
                  <div>
                    <small>{delivery.orderNumber || 'Pedido sem número'} · {delivery.document || 'Sem documento'}</small>
                    <h3>{delivery.title}</h3>
                    <p>{delivery.customer?.name || 'Cliente não informado'} · {getDeliveryAddress(delivery)}</p>
                  </div>
                  <span className={getDeliveryStatusClass(delivery.status)}>{delivery.status}</span>
                </div>

                <div className="driver-dispatch-meta">
                  <span><strong>Atual:</strong> {delivery.driver?.name || 'Sem entregador'}</span>
                  <span><strong>Previsão:</strong> {formatDateTime(delivery.scheduledDate)}</span>
                  <span><strong>Prioridade:</strong> {delivery.priority || '-'}</span>
                  <span><strong>Itens:</strong> {(delivery.items || []).length || 'sem itens'}</span>
                </div>

                {(delivery.items || []).length > 0 ? (
                  <div className="driver-dispatch-items">
                    {delivery.items.slice(0, 4).map((item) => (
                      <span key={item.id}>
                        {Number(item.quantity || 0).toLocaleString('pt-BR')} {item.unit} · {item.product?.name || 'Produto'} · {item.stockStatus === 'baixado' ? 'estoque baixado' : 'aguardando baixa'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="driver-dispatch-items warning">
                    Nenhum produto vinculado. A entrega será enviada sem baixa de estoque.
                  </div>
                )}

                <div className="driver-dispatch-actions">
                  <select
                    value={selectedDrivers[delivery.id] || ''}
                    onChange={(event) => handleDriverSelection(delivery.id, event.target.value)}
                  >
                    <option value="">Selecionar entregador</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>

                  <button type="button" onClick={() => handleSendToDriver(delivery)} disabled={sendingId === delivery.id}>
                    {sendingId === delivery.id ? 'Enviando...' : 'Enviar para caixa'}
                  </button>
                </div>
              </article>
            ))}

            {!loading && filteredDeliveries.length === 0 && (
              <div className="empty-documents">Nenhuma entrega ativa encontrada para os filtros selecionados.</div>
            )}
          </div>
        </article>

        <aside className="driver-box-overview">
          <div className="panel-title compact">
            <div>
              <h2>Caixas dos entregadores</h2>
              <p>Resumo das entregas ativas por entregador.</p>
            </div>
          </div>

          <div className="driver-box-list">
            {driverBoxes.map(({ driver, assigned, inRoute, waiting }) => (
              <article className="driver-box-card" key={driver.id}>
                <div className="driver-box-card-head">
                  <div>
                    <strong>{driver.name}</strong>
                    <span>{driver.email}</span>
                  </div>
                  <b>{assigned.length}</b>
                </div>
                <div className="driver-box-card-stats">
                  <span>{waiting} na caixa</span>
                  <span>{inRoute} em rota</span>
                </div>
                <button
                  className="driver-box-view-button"
                  type="button"
                  onClick={() => setOpenDriverBoxId(driver.id)}
                >
                  Ver todas as entregas
                </button>
                <div className="driver-box-card-items">
                  {assigned.slice(0, 4).map((delivery) => (
                    <p key={delivery.id}>
                      <strong>{delivery.orderNumber || delivery.title}</strong>
                      <span>{delivery.city}/{delivery.state} · {delivery.status}</span>
                    </p>
                  ))}
                  {assigned.length === 0 && <small>Nenhuma entrega ativa na caixa.</small>}
                </div>
              </article>
            ))}

            {!loading && drivers.length === 0 && (
              <div className="empty-documents">Nenhum entregador ativo cadastrado.</div>
            )}
          </div>
        </aside>
      </section>

      {selectedDriverBox && (
        <div
          className="record-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Entregas da caixa do entregador ${selectedDriverBox.driver.name}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenDriverBoxId('');
          }}
        >
          <article className="record-modal-card driver-box-modal-card">
            <header className="record-modal-header">
              <div>
                <span>Caixa do entregador</span>
                <h2>{selectedDriverBox.driver.name}</h2>
                <p>
                  {selectedDriverBox.assigned.length} entrega{selectedDriverBox.assigned.length === 1 ? '' : 's'} ativa
                  {selectedDriverBox.assigned.length === 1 ? '' : 's'} vinculada{selectedDriverBox.assigned.length === 1 ? '' : 's'} a este entregador.
                </p>
              </div>
              <button type="button" onClick={() => setOpenDriverBoxId('')} aria-label="Fechar">×</button>
            </header>

            <section className="driver-box-modal-kpis">
              <article>
                <span>Total na caixa</span>
                <strong>{selectedDriverBox.assigned.length}</strong>
              </article>
              <article>
                <span>Aguardando aceite</span>
                <strong>{selectedDriverBox.assigned.filter((delivery) => delivery.status === 'enviada').length}</strong>
              </article>
              <article>
                <span>Recebidas</span>
                <strong>{selectedDriverBox.assigned.filter((delivery) => delivery.status === 'recebida').length}</strong>
              </article>
              <article>
                <span>Em rota</span>
                <strong>{selectedDriverBox.inRoute}</strong>
              </article>
            </section>

            <div className="driver-box-modal-list">
              {selectedDriverBox.assigned.map((delivery) => (
                <article className="driver-box-modal-delivery" key={delivery.id}>
                  <div className="driver-box-modal-delivery-head">
                    <div>
                      <small>{delivery.orderNumber || 'Pedido sem número'} · {delivery.document || 'Sem documento'}</small>
                      <h3>{delivery.title}</h3>
                      <p>{delivery.customer?.name || 'Cliente não informado'}</p>
                    </div>
                    <span className={getDeliveryStatusClass(delivery.status)}>{delivery.status}</span>
                  </div>

                  <div className="driver-box-modal-delivery-grid">
                    <span><strong>Destinatário:</strong> {delivery.recipientName || '-'}</span>
                    <span><strong>Previsão:</strong> {formatDateTime(delivery.scheduledDate)}</span>
                    <span><strong>Endereço:</strong> {getDeliveryAddress(delivery) || '-'}</span>
                    <span><strong>Prioridade:</strong> {delivery.priority || '-'}</span>
                    <span><strong>Taxa:</strong> R$ {Number(delivery.deliveryFee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span><strong>Itens:</strong> {(delivery.items || []).length || 'sem itens vinculados'}</span>
                  </div>

                  {(delivery.items || []).length > 0 && (
                    <div className="driver-box-modal-items">
                      {delivery.items.map((item) => (
                        <span key={item.id}>
                          {Number(item.quantity || 0).toLocaleString('pt-BR')} {item.unit || 'UN'} · {item.product?.name || 'Produto'}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}

              {selectedDriverBox.assigned.length === 0 && (
                <div className="empty-documents">Este entregador ainda não possui entregas ativas na caixa.</div>
              )}
            </div>

            <footer className="record-modal-footer">
              <button type="button" onClick={() => setOpenDriverBoxId('')}>Fechar</button>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}

export default CaixaEntregador;
