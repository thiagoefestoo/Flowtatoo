import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const emptyRow = { productId: '', quantity: 1, unitPrice: '', notes: '' };
const activeStatuses = ['pendente', 'enviada', 'recebida', 'em_rota', 'nao_entregue'];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getDeliveryLabel(delivery) {
  if (!delivery) return '';
  const customer = delivery.customer?.tradeName || delivery.customer?.name || 'Cliente não informado';
  return `${delivery.orderNumber || delivery.document || delivery.title} · ${customer} · ${delivery.city}/${delivery.state}`;
}

function getItemStatusLabel(item) {
  if (item.stockStatus === 'baixado') return 'Estoque baixado';
  if (item.stockStatus === 'devolvido') return 'Devolvido ao estoque';
  return 'Aguardando envio';
}

function SeparacaoEstoque() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totals: {}, deliveries: [] });
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDelivery = useMemo(
    () => deliveries.find((delivery) => delivery.id === selectedDeliveryId),
    [deliveries, selectedDeliveryId]
  );

  const activeDeliveries = useMemo(
    () => deliveries.filter((delivery) => activeStatuses.includes(delivery.status)),
    [deliveries]
  );

  async function loadBaseData() {
    setLoading(true);
    setMessage('');

    try {
      const [deliveriesResult, productsResult, summaryResult] = await Promise.all([
        apiRequest('/deliveries'),
        apiRequest('/products?type=produto&status=ativo'),
        apiRequest('/deliveries/inventory-summary'),
      ]);

      setDeliveries(extractData(deliveriesResult));
      setProducts(extractData(productsResult).filter((product) => product.trackStock));
      setSummary(summaryResult.data || { totals: {}, deliveries: [] });
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar controle de separação.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  async function loadDeliveryItems(deliveryId) {
    if (!deliveryId) {
      setRows([{ ...emptyRow }]);
      return;
    }

    setMessage('');

    try {
      const result = await apiRequest(`/deliveries/${deliveryId}/items`);
      const items = result.data?.items || [];

      if (items.length) {
        setRows(items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          unitPrice: item.unitPrice || '',
          notes: item.notes || '',
          stockStatus: item.stockStatus,
          product: item.product,
        })));
      } else {
        setRows([{ ...emptyRow }]);
      }
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar itens da entrega.');
    }
  }

  function handleSelectDelivery(event) {
    const deliveryId = event.target.value;
    setSelectedDeliveryId(deliveryId);
    loadDeliveryItems(deliveryId);
  }

  function handleRowChange(index, field, value) {
    setRows((current) => current.map((row, rowIndex) => {
      if (rowIndex !== index) return row;

      const next = { ...row, [field]: value };

      if (field === 'productId') {
        const product = products.find((item) => item.id === value);
        next.unitPrice = product?.salePrice || '';
        next.product = product || null;
      }

      return next;
    }));
  }

  function addRow() {
    setRows((current) => [...current, { ...emptyRow }]);
  }

  function removeRow(index) {
    setRows((current) => current.length === 1 ? [{ ...emptyRow }] : current.filter((_, rowIndex) => rowIndex !== index));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!selectedDeliveryId) {
      setMessage('Selecione uma entrega para vincular os produtos.');
      return;
    }

    const items = rows
      .filter((row) => row.productId && Number(row.quantity || 0) > 0)
      .map((row) => ({
        productId: row.productId,
        quantity: Number(row.quantity),
        unitPrice: row.unitPrice ? Number(row.unitPrice) : undefined,
        notes: row.notes,
      }));

    if (!items.length) {
      setMessage('Adicione pelo menos um produto com quantidade para salvar.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const result = await apiRequest(`/deliveries/${selectedDeliveryId}/items`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });

      setMessage(result.message || 'Itens da entrega salvos com sucesso.');
      await Promise.all([loadDeliveryItems(selectedDeliveryId), loadBaseData()]);
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar itens da entrega.');
    } finally {
      setSaving(false);
    }
  }

  const selectedTotals = useMemo(() => {
    return rows.reduce((acc, row) => {
      const quantity = Number(row.quantity || 0);
      const product = products.find((item) => item.id === row.productId) || row.product;
      const price = Number(row.unitPrice || product?.salePrice || 0);
      acc.quantity += quantity;
      acc.value += quantity * price;
      return acc;
    }, { quantity: 0, value: 0 });
  }, [rows, products]);

  return (
    <section className="module-page delivery-items-page">
      <div className="page-header">
        <div>
          <span>Controle operacional</span>
          <h1>Separação e itens da entrega</h1>
          <p>
            Vincule produtos à entrega antes de enviar para a caixa do entregador. Quando a entrega for enviada,
            o sistema baixa automaticamente o estoque dos itens separados.
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={loadBaseData} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article>
          <span>Entregas com itens</span>
          <strong>{summary.totals?.deliveriesWithItems || 0}</strong>
          <p>possuem produtos vinculados</p>
        </article>
        <article>
          <span>Itens vinculados</span>
          <strong>{summary.totals?.totalItems || 0}</strong>
          <p>linhas de separação</p>
        </article>
        <article>
          <span>Estoque baixado</span>
          <strong>{summary.totals?.stockDeducted || 0}</strong>
          <p>itens enviados ao entregador</p>
        </article>
        <article>
          <span>Pendente baixa</span>
          <strong>{summary.totals?.pendingStock || 0}</strong>
          <p>aguardam envio para caixa</p>
        </article>
      </section>

      <section className="form-panel delivery-items-editor">
        <div className="panel-title">
          <div>
            <h2>Montar separação</h2>
            <p>Escolha a entrega e informe os produtos que serão enviados.</p>
          </div>
          <div className="delivery-items-totals">
            <span>{formatNumber(selectedTotals.quantity)} unidade(s)</span>
            <strong>{formatCurrency(selectedTotals.value)}</strong>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <label className="form-full">
            Entrega ativa
            <select value={selectedDeliveryId} onChange={handleSelectDelivery} required>
              <option value="">Selecione a entrega...</option>
              {activeDeliveries.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>{getDeliveryLabel(delivery)}</option>
              ))}
            </select>
          </label>

          {selectedDelivery && (
            <div className="delivery-selected-box">
              <strong>{selectedDelivery.title}</strong>
              <span>{selectedDelivery.customer?.name || 'Cliente não informado'} · {selectedDelivery.status}</span>
              <p>{[selectedDelivery.address, selectedDelivery.number, selectedDelivery.district, selectedDelivery.city, selectedDelivery.state].filter(Boolean).join(', ')}</p>
            </div>
          )}

          <div className="delivery-items-rows">
            {rows.map((row, index) => {
              const product = products.find((item) => item.id === row.productId) || row.product;
              const stockStatus = row.stockStatus;
              const locked = stockStatus === 'baixado';

              return (
                <div className="delivery-item-row" key={`${index}-${row.productId || 'new'}`}>
                  <label>
                    Produto
                    <select
                      value={row.productId}
                      onChange={(event) => handleRowChange(index, 'productId', event.target.value)}
                      disabled={locked}
                      required
                    >
                      <option value="">Selecione...</option>
                      {products.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · estoque {formatNumber(item.currentStock)} {item.unit}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Quantidade
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={row.quantity}
                      onChange={(event) => handleRowChange(index, 'quantity', event.target.value)}
                      disabled={locked}
                      required
                    />
                  </label>

                  <label>
                    Valor unitário
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.unitPrice}
                      onChange={(event) => handleRowChange(index, 'unitPrice', event.target.value)}
                      disabled={locked}
                      placeholder={product?.salePrice || '0.00'}
                    />
                  </label>

                  <label>
                    Observação
                    <input
                      value={row.notes}
                      onChange={(event) => handleRowChange(index, 'notes', event.target.value)}
                      disabled={locked}
                      placeholder="Ex.: frágil, refrigerado..."
                    />
                  </label>

                  <div className="delivery-item-row-actions">
                    {stockStatus && <span className={`status-badge stock-${stockStatus}`}>{getItemStatusLabel(row)}</span>}
                    <button type="button" className="ghost-button" onClick={() => removeRow(index)} disabled={locked}>
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-actions split-actions">
            <button type="button" className="ghost-button" onClick={addRow}>Adicionar produto</button>
            <button type="submit" disabled={saving || !selectedDeliveryId}>{saving ? 'Salvando...' : 'Salvar itens da entrega'}</button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Entregas com produtos vinculados</h2>
            <p>Controle do que será entregue e do que já teve baixa no estoque.</p>
          </div>
        </div>

        <div className="delivery-items-summary-list">
          {(summary.deliveries || []).slice(0, 12).map((delivery) => (
            <article className="delivery-summary-card" key={delivery.id}>
              <div>
                <small>{delivery.orderNumber || delivery.document || 'Sem pedido'} · {delivery.status}</small>
                <h3>{delivery.title}</h3>
                <p>{delivery.customer?.tradeName || delivery.customer?.name || 'Cliente não informado'}</p>
              </div>
              <div className="delivery-summary-items">
                {(delivery.items || []).map((item) => (
                  <span key={item.id}>
                    {formatNumber(item.quantity)} {item.unit} · {item.product?.name || 'Produto'} · {getItemStatusLabel(item)}
                  </span>
                ))}
              </div>
            </article>
          ))}

          {!loading && !(summary.deliveries || []).length && (
            <div className="empty-documents">Nenhuma entrega com produtos vinculados ainda.</div>
          )}
        </div>
      </section>
    </section>
  );
}

export default SeparacaoEstoque;
