import { useEffect, useMemo, useState } from 'react';

import MapModal from '../components/MapModal';
import { apiRequest, extractData } from '../services/api';
import { buildMapSearchEmbedUrl, buildRouteEmbedUrl, getDeliveryAddressText } from '../utils/maps';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function Rotas() {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState({ driverId: '', status: '', q: '' });
  const [message, setMessage] = useState('');
  const [mapModal, setMapModal] = useState(null);

  async function loadData() {
    try {
      const [deliveriesResult, driversResult] = await Promise.all([
        apiRequest('/deliveries'),
        apiRequest('/users?role=entregador'),
      ]);
      setDeliveries(extractData(deliveriesResult));
      setDrivers(extractData(driversResult));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeliveries = useMemo(() => deliveries.filter((item) => {
    if (filters.driverId && item.driverId !== filters.driverId) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.q) {
      const text = `${item.title} ${item.orderNumber} ${item.city} ${item.address} ${item.customer?.name || ''}`.toLowerCase();
      if (!text.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  }), [deliveries, filters]);

  const groupedByDriver = useMemo(() => {
    const map = new Map();
    filteredDeliveries.forEach((item) => {
      const key = item.driver?.name || 'Sem entregador';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [filteredDeliveries]);

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Planejamento de campo</span>
          <h1>Rotas</h1>
          <p>Organize entregas por entregador, acompanhe status e abra rotas diretamente no Google Maps.</p>
        </div>
        <button type="button" className="ghost-button" onClick={loadData}>Atualizar</button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article><span>Entregas filtradas</span><strong>{filteredDeliveries.length}</strong><p>ordens na visão atual</p></article>
        <article><span>Em rota</span><strong>{filteredDeliveries.filter((item) => item.status === 'em_rota').length}</strong><p>execução em campo</p></article>
        <article><span>Sem entregador</span><strong>{filteredDeliveries.filter((item) => !item.driverId).length}</strong><p>precisam de alocação</p></article>
        <article><span>Entregadores</span><strong>{groupedByDriver.length}</strong><p>grupos na rota</p></article>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Filtros de rota</h2>
            <p>Refine a operação por entregador, status ou palavra-chave.</p>
          </div>
          <div className="filters">
            <input type="search" placeholder="Buscar entrega" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value }))} />
            <select value={filters.driverId} onChange={(e) => setFilters((c) => ({ ...c, driverId: e.target.value }))}>
              <option value="">Entregador</option>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
              <option value="">Status</option>
              <option value="pendente">Pendente</option>
              <option value="enviada">Enviada</option>
              <option value="recebida">Recebida</option>
              <option value="em_rota">Em rota</option>
              <option value="entregue">Entregue</option>
              <option value="nao_entregue">Não entregue</option>
            </select>
          </div>
        </div>
      </section>

      <section className="delivery-mobile-grid">
        {groupedByDriver.map(([driverName, items]) => (
          <article className="delivery-mobile-card" key={driverName}>
            <div className="delivery-mobile-head">
              <div>
                <small>Entregador</small>
                <h3>{driverName}</h3>
              </div>
              <button
                type="button"
                className="document-button"
                onClick={() => setMapModal({
                  title: `Rota geral · ${driverName}`,
                  subtitle: `${items.length} entrega(s) na rota`,
                  url: buildRouteEmbedUrl(items),
                })}
              >
                Abrir rota geral
              </button>
            </div>

            <div className="document-list-panel">
              {items.map((item) => (
                <article className="document-list-item" key={item.id}>
                  <div>
                    <strong>{item.orderNumber || 'Entrega'} · {item.title}</strong>
                    <span>{item.customer?.name || 'Cliente'} · {item.city}/{item.state} · {formatDateTime(item.scheduledDate)}</span>
                    <small>{[item.address, item.number, item.district].filter(Boolean).join(', ')}</small>
                  </div>
                  <div>
                    <span className={`status-badge crm-status-${String(item.status || 'pendente').replaceAll('_', '-')}`}>{item.status}</span>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setMapModal({
                        title: item.orderNumber || 'Entrega',
                        subtitle: getDeliveryAddressText(item),
                        url: buildMapSearchEmbedUrl(item),
                      })}
                    >
                      Mapa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ))}

        {groupedByDriver.length === 0 && <div className="empty-documents">Nenhuma entrega encontrada para os filtros aplicados.</div>}
      </section>

      <MapModal
        isOpen={Boolean(mapModal)}
        title={mapModal?.title}
        subtitle={mapModal?.subtitle}
        mapUrl={mapModal?.url}
        onClose={() => setMapModal(null)}
      />
    </div>
  );
}

export default Rotas;
