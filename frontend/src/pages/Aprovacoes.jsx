import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';
import { useAppModal } from '../components/AppModalProvider';

function Aprovacoes() {
  const { confirm } = useAppModal();
  const [deliveries, setDeliveries] = useState([]);
  const [message, setMessage] = useState('');

  async function loadApprovals() {
    try {
      const result = await apiRequest('/deliveries?approvalStatus=pendente');
      setDeliveries(extractData(result));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  async function decide(item, action) {
    const confirmed = await confirm({
      title: action === 'approve' ? 'Aprovar entrega' : 'Reprovar entrega',
      message: `${action === 'approve' ? 'Aprovar' : 'Reprovar'} a entrega ${item.title}?`,
      confirmText: action === 'approve' ? 'Aprovar' : 'Reprovar',
      cancelText: 'Cancelar',
      danger: action === 'reject',
    });

    if (!confirmed) return;

    try {
      const result = await apiRequest(`/deliveries/${item.id}/${action}`, { method: 'POST' });
      setMessage(result.message || 'Aprovação atualizada.');
      await loadApprovals();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Governança operacional</span>
          <h1>Aprovações</h1>
          <p>Valide entregas antes de considerá-las liberadas para controle final, relatórios e conferência operacional.</p>
        </div>
        <button type="button" className="ghost-button" onClick={loadApprovals}>Atualizar</button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article><span>Pendentes</span><strong>{deliveries.length}</strong><p>aguardando aprovação</p></article>
      </section>

      <section className="list-panel">
        <div className="panel-title"><div><h2>Entregas pendentes</h2><p>Analise cliente, rota e entregador responsável.</p></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Pedido</th><th>Entrega</th><th>Cliente</th><th>Entregador</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {deliveries.map((item) => (
                <tr key={item.id}>
                  <td>{item.orderNumber || '-'}</td>
                  <td>{item.title}</td>
                  <td>{item.customer?.name || '-'}</td>
                  <td>{item.driver?.name || '-'}</td>
                  <td><span className={`status-badge crm-status-${String(item.status || 'pendente').replaceAll('_', '-')}`}>{item.status}</span></td>
                  <td>
                    <div className="table-actions crm-table-actions-expanded">
                      <button type="button" className="approval-button" onClick={() => decide(item, 'approve')}>Aprovar</button>
                      <button type="button" className="danger-button" onClick={() => decide(item, 'reject')}>Reprovar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && <tr><td className="empty-table" colSpan="6">Nenhuma entrega pendente de aprovação.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Aprovacoes;
