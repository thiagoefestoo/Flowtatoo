import { useEffect, useMemo, useState } from 'react';

import MapModal from '../components/MapModal';
import { apiRequest, extractData } from '../services/api';
import { buildMapSearchEmbedUrl, getDeliveryAddressText } from '../utils/maps';

const statusButtons = [
  { value: 'recebida', label: 'Recebida' },
  { value: 'em_rota', label: 'Em rota' },
  { value: 'entregue', label: 'Entregue sem anexo' },
  { value: 'nao_entregue', label: 'Não entregue' },
];

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function MinhasEntregas() {
  const [deliveries, setDeliveries] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [proofForms, setProofForms] = useState({});
  const [occurrenceForms, setOccurrenceForms] = useState({});
  const [mapModal, setMapModal] = useState(null);

  async function loadDeliveries() {
    try {
      const result = await apiRequest('/deliveries/my-deliveries');
      setDeliveries(extractData(result));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function handleStatusChange(item, status) {
    try {
      setLoadingId(`${item.id}:${status}`);
      setMessage('');
      const result = await apiRequest(`/deliveries/${item.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setMessage(result.message || 'Status atualizado com sucesso.');
      await loadDeliveries();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingId('');
    }
  }

  async function handleProofUpload(event, item) {
    event.preventDefault();
    const form = proofForms[item.id] || {};

    if (!form.file) {
      setMessage('Selecione uma foto ou arquivo de comprovante.');
      return;
    }

    const data = new FormData();
    data.append('proof', form.file);
    data.append('notes', form.notes || 'Comprovante de entrega enviado pelo entregador.');
    data.append('driverNotes', form.notes || 'Entrega concluída com comprovante.');

    try {
      setLoadingId(`${item.id}:proof`);
      const result = await apiRequest(`/deliveries/${item.id}/proof`, {
        method: 'POST',
        body: data,
      });
      setMessage(result.message || 'Comprovante enviado com sucesso.');
      setProofForms((current) => ({ ...current, [item.id]: { file: null, notes: '' } }));
      await loadDeliveries();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingId('');
    }
  }

  async function handleOccurrenceSubmit(event, item) {
    event.preventDefault();
    const form = occurrenceForms[item.id] || {};

    if (!form.description) {
      setMessage('Descreva a ocorrência antes de enviar.');
      return;
    }

    try {
      setLoadingId(`${item.id}:occurrence`);
      const result = await apiRequest('/delivery-occurrences', {
        method: 'POST',
        body: JSON.stringify({
          deliveryId: item.id,
          type: form.type || 'outro',
          severity: form.severity || 'media',
          description: form.description,
        }),
      });
      setMessage(result.message || 'Ocorrência registrada com sucesso.');
      setOccurrenceForms((current) => ({ ...current, [item.id]: { type: 'outro', severity: 'media', description: '' } }));
      await loadDeliveries();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingId('');
    }
  }

  const grouped = useMemo(() => ({
    ativas: deliveries.filter((item) => !['entregue', 'cancelada'].includes(item.status)),
    concluidas: deliveries.filter((item) => item.status === 'entregue'),
  }), [deliveries]);

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Aplicação do entregador</span>
          <h1>Minhas entregas</h1>
          <p>Receba ordens de entrega no smartphone, abra a rota, atualize status, envie comprovante e registre ocorrências.</p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article><span>Ativas</span><strong>{grouped.ativas.length}</strong><p>entregas em andamento</p></article>
        <article><span>Concluídas</span><strong>{grouped.concluidas.length}</strong><p>entregas finalizadas</p></article>
      </section>

      <section className="delivery-mobile-grid">
        {deliveries.map((item) => (
          <article key={item.id} className="delivery-mobile-card">
            <div className="delivery-mobile-head">
              <div>
                <small>{item.orderNumber || 'Pedido sem número'}</small>
                <h3>{item.title}</h3>
              </div>
              <span className={`status-badge crm-status-${String(item.status || 'pendente').replaceAll('_', '-')}`}>{item.status}</span>
            </div>

            <div className="delivery-mobile-body">
              <p><strong>Cliente:</strong> {item.customer?.name || '-'}</p>
              <p><strong>Destinatário:</strong> {item.recipientName || '-'}</p>
              <p><strong>Telefone:</strong> {item.recipientPhone || item.customer?.phone || '-'}</p>
              <p><strong>Endereço:</strong> {[item.address, item.number, item.district, item.city, item.state].filter(Boolean).join(', ')}</p>
              <p><strong>Previsão:</strong> {formatDateTime(item.scheduledDate)}</p>
              <p><strong>Observações:</strong> {item.notes || '-'}</p>
            </div>

            <div className="delivery-mobile-actions">
              <button
                type="button"
                className="document-button"
                onClick={() => setMapModal({
                  title: item.orderNumber || 'Entrega',
                  subtitle: getDeliveryAddressText(item),
                  url: buildMapSearchEmbedUrl(item),
                })}
              >
                Abrir mapa
              </button>

              <div className="delivery-status-actions">
                {statusButtons.map((button) => (
                  <button key={button.value} type="button" onClick={() => handleStatusChange(item, button.value)} disabled={loadingId === `${item.id}:${button.value}`}>
                    {loadingId === `${item.id}:${button.value}` ? 'Atualizando...' : button.label}
                  </button>
                ))}
              </div>

              <form className="driver-proof-form" onSubmit={(event) => handleProofUpload(event, item)}>
                <strong>Comprovante de entrega</strong>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(event) => setProofForms((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), file: event.target.files?.[0] || null } }))} />
                <input type="text" placeholder="Observação do comprovante" value={proofForms[item.id]?.notes || ''} onChange={(event) => setProofForms((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), notes: event.target.value } }))} />
                <button type="submit" disabled={loadingId === `${item.id}:proof`}>{loadingId === `${item.id}:proof` ? 'Enviando...' : 'Enviar comprovante e concluir'}</button>
              </form>

              <form className="driver-proof-form" onSubmit={(event) => handleOccurrenceSubmit(event, item)}>
                <strong>Registrar ocorrência</strong>
                <select value={occurrenceForms[item.id]?.type || 'outro'} onChange={(event) => setOccurrenceForms((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), type: event.target.value } }))}>
                  <option value="cliente_ausente">Cliente ausente</option>
                  <option value="endereco_incorreto">Endereço incorreto</option>
                  <option value="recusa_recebimento">Recusa no recebimento</option>
                  <option value="produto_avariado">Produto avariado</option>
                  <option value="atraso_rota">Atraso na rota</option>
                  <option value="problema_operacional">Problema operacional</option>
                  <option value="outro">Outro</option>
                </select>
                <textarea placeholder="Descreva o que aconteceu" value={occurrenceForms[item.id]?.description || ''} onChange={(event) => setOccurrenceForms((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), description: event.target.value } }))} />
                <button type="submit" disabled={loadingId === `${item.id}:occurrence`}>{loadingId === `${item.id}:occurrence` ? 'Registrando...' : 'Enviar ocorrência'}</button>
              </form>
            </div>
          </article>
        ))}

        {deliveries.length === 0 && <div className="empty-documents">Nenhuma entrega atribuída ao seu usuário.</div>}
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

export default MinhasEntregas;
