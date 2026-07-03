import { useEffect, useMemo, useState } from 'react';

import { useAppModal } from '../components/AppModalProvider';
import { apiRequest, extractData } from '../services/api';

const emptyForm = {
  customerId: '',
  number: '',
  issueDate: new Date().toISOString().slice(0, 10),
  paymentStatus: 'pendente',
  discount: '',
  freight: '',
  notes: '',
};

const emptyItem = {
  productId: '',
  quantity: '',
  unitPrice: '',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getSaleStatusLabel(status) {
  const labels = {
    rascunho: 'Rascunho',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
  };

  return labels[status] || status || '-';
}

function getApprovalStatusLabel(status) {
  const labels = {
    nao_enviado: 'Não enviado',
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
  };

  return labels[status] || status || '-';
}

function Vendas() {
  const { confirm, prompt: promptModal } = useAppModal();

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    confirmadas: 0,
    rascunhos: 0,
    canceladas: 0,
    pendentesAprovacao: 0,
    aprovadas: 0,
    reprovadas: 0,
    totalVendido: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [item, setItem] = useState(emptyItem);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => {
    return items.reduce((sum, currentItem) => {
      return sum + Number(currentItem.quantity || 0) * Number(currentItem.unitPrice || 0);
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    return subtotal - Number(form.discount || 0) + Number(form.freight || 0);
  }, [form.discount, form.freight, subtotal]);

  async function loadSales() {
    const result = await apiRequest('/sales');
    setSales(extractData(result));
  }

  async function loadCustomers() {
    const result = await apiRequest('/customers?status=ativo');
    setCustomers(extractData(result));
  }

  async function loadProducts() {
    const result = await apiRequest('/products?status=ativo');
    setProducts(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/sales/stats');
    setStats(result.data || {});
  }

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadSales(),
        loadCustomers(),
        loadProducts(),
        loadStats(),
      ]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar vendas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleItemChange(event) {
    const { name, value } = event.target;

    if (name === 'productId') {
      const selectedProduct = products.find((product) => product.id === value);

      setItem((current) => ({
        ...current,
        productId: value,
        unitPrice: selectedProduct?.salePrice || '',
      }));

      return;
    }

    setItem((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAddItem() {
    setMessage('');

    if (!item.productId) {
      setMessage('Selecione um produto para adicionar.');
      return;
    }

    if (!item.quantity || Number(item.quantity) <= 0) {
      setMessage('Informe uma quantidade maior que zero.');
      return;
    }

    const selectedProduct = products.find((product) => product.id === item.productId);

    if (!selectedProduct) {
      setMessage('Produto não encontrado.');
      return;
    }

    const currentStock = Number(selectedProduct.currentStock || 0);
    const quantity = Number(item.quantity || 0);

    if (selectedProduct.trackStock && quantity > currentStock) {
      setMessage(`Estoque insuficiente para ${selectedProduct.name}. Disponível: ${currentStock}.`);
      return;
    }

    const newItem = {
      productId: item.productId,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      unit: selectedProduct.unit,
      currentStock,
      quantity,
      unitPrice: Number(item.unitPrice || selectedProduct.salePrice || 0),
    };

    setItems((current) => [...current, newItem]);
    setItem(emptyItem);
  }

  function handleRemoveItem(indexToRemove) {
    setItems((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      issueDate: new Date().toISOString().slice(0, 10),
    });

    setItem(emptyItem);
    setItems([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (items.length === 0) {
      setMessage('Adicione pelo menos um item na venda.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        discount: Number(form.discount || 0),
        freight: Number(form.freight || 0),
        items: items.map((currentItem) => ({
          productId: currentItem.productId,
          quantity: Number(currentItem.quantity || 0),
          unitPrice: Number(currentItem.unitPrice || 0),
        })),
      };

      const result = await apiRequest('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(result.message || 'Venda criada como rascunho.');
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao criar venda.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestApproval(sale) {
    const confirmed = await confirm({
      title: 'Enviar venda para aprovação',
      message: `Deseja enviar a venda "${sale.number}" para aprovação?`,
      confirmText: 'Enviar para aprovação',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/sales/${sale.id}/request-approval`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Venda enviada para aprovação.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao enviar venda para aprovação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveSale(sale) {
    const confirmed = await confirm({
      title: 'Aprovar venda',
      message: `Deseja aprovar a venda "${sale.number}"? Isso vai baixar estoque e gerar financeiro a receber.`,
      confirmText: 'Aprovar venda',
      cancelText: 'Voltar',
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/sales/${sale.id}/approve`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Venda aprovada com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao aprovar venda.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectSale(sale) {
    const reason = await promptModal({
      title: 'Reprovar venda',
      message: `Informe o motivo da reprovação da venda "${sale.number}".`,
      inputLabel: 'Motivo',
      inputPlaceholder: 'Ex: preço incorreto, cliente pendente, estoque reservado...',
      confirmText: 'Reprovar venda',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!reason) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/sales/${sale.id}/reject-approval`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason,
        }),
      });

      setMessage(result.message || 'Venda reprovada com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao reprovar venda.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSale(sale) {
    const confirmed = await confirm({
      title: 'Cancelar venda',
      message: sale.status === 'confirmada'
        ? `Cancelar a venda "${sale.number}"? O sistema devolverá os itens ao estoque e cancelará o financeiro gerado.`
        : `Deseja cancelar a venda "${sale.number}"?`,
      confirmText: 'Cancelar venda',
      cancelText: 'Voltar',
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await apiRequest(`/sales/${sale.id}/cancel`, {
        method: 'PATCH',
      });

      setMessage(result.message || 'Venda cancelada com sucesso.');
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao cancelar venda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Flowtatoo Core</span>
          <h1>Vendas</h1>
          <p>
            Registre vendas como rascunho, envie para aprovação e contabilize
            somente após aprovação.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <div className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats.total || 0}</strong>
          <p>Vendas cadastradas.</p>
        </article>

        <article>
          <span>Pendentes</span>
          <strong>{stats.pendentesAprovacao || 0}</strong>
          <p>Aguardando aprovação.</p>
        </article>

        <article>
          <span>Confirmadas</span>
          <strong>{stats.confirmadas || 0}</strong>
          <p>Vendas efetivadas.</p>
        </article>

        <article>
          <span>Total vendido</span>
          <strong>{formatCurrency(stats.totalVendido)}</strong>
          <p>Somente vendas aprovadas.</p>
        </article>
      </div>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>Nova venda</h2>
            <p>
              A venda será criada como rascunho. Para contabilizar, envie para
              aprovação.
            </p>
          </div>
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Cliente *
            <select
              name="customerId"
              value={form.customerId}
              onChange={handleFormChange}
              required
            >
              <option value="">Selecione...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.tradeName || customer.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Número da venda
            <input
              name="number"
              value={form.number}
              onChange={handleFormChange}
              placeholder="Ex: VENDA-002"
            />
          </label>

          <label>
            Data
            <input
              name="issueDate"
              type="date"
              value={form.issueDate}
              onChange={handleFormChange}
              required
            />
          </label>

          <label>
            Pagamento
            <select
              name="paymentStatus"
              value={form.paymentStatus}
              onChange={handleFormChange}
            >
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="pago">Pago</option>
            </select>
          </label>

          <label>
            Desconto
            <input
              name="discount"
              type="number"
              step="0.01"
              value={form.discount}
              onChange={handleFormChange}
            />
          </label>

          <label>
            Frete
            <input
              name="freight"
              type="number"
              step="0.01"
              value={form.freight}
              onChange={handleFormChange}
            />
          </label>

          <label className="form-full">
            Observações
            <textarea name="notes" value={form.notes} onChange={handleFormChange} />
          </label>

          <div className="form-full purchase-items-box">
            <div className="purchase-items-title">
              <div>
                <h3>Itens da venda</h3>
                <p>Adicione os produtos ou serviços antes de salvar.</p>
              </div>

              <strong>{formatCurrency(total)}</strong>
            </div>

            <div className="purchase-item-form">
              <label>
                Produto / Serviço
                <select
                  name="productId"
                  value={item.productId}
                  onChange={handleItemChange}
                >
                  <option value="">Selecione...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Estoque: {product.trackStock ? product.currentStock : 'N/A'}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantidade
                <input
                  name="quantity"
                  type="number"
                  step="0.001"
                  value={item.quantity}
                  onChange={handleItemChange}
                />
              </label>

              <label>
                Preço unitário
                <input
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={handleItemChange}
                />
              </label>

              <button type="button" onClick={handleAddItem}>
                Adicionar item
              </button>
            </div>

            <div className="purchase-items-list">
              {items.map((currentItem, index) => (
                <div className="purchase-item-row" key={`${currentItem.productId}-${index}`}>
                  <div>
                    <strong>{currentItem.productName}</strong>
                    <span>
                      {currentItem.sku || currentItem.unit || 'Sem código'} | Estoque: {currentItem.currentStock}
                    </span>
                  </div>

                  <span>Qtd: {currentItem.quantity}</span>
                  <span>Preço: {formatCurrency(currentItem.unitPrice)}</span>
                  <span>Total: {formatCurrency(currentItem.quantity * currentItem.unitPrice)}</span>

                  <button type="button" onClick={() => handleRemoveItem(index)}>
                    Remover
                  </button>
                </div>
              ))}

              {items.length === 0 && (
                <p className="empty-items">Nenhum item adicionado ainda.</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar venda em rascunho'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Vendas cadastradas</h2>
            <p>{sales.length} resultado(s)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Venda</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Aprovação</th>
                <th>Pagamento</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <strong>{sale.number}</strong>
                    <span>{sale.issueDate}</span>
                  </td>

                  <td>
                    <strong>{sale.customer?.tradeName || sale.customer?.name || '-'}</strong>
                    <span>{sale.customer?.document || '-'}</span>
                  </td>

                  <td>
                    <span className={`status-badge sale-${sale.status}`}>
                      {getSaleStatusLabel(sale.status)}
                    </span>
                  </td>

                  <td>
                    <span className={`status-badge approval-${sale.approvalStatus || 'nao_enviado'}`}>
                      {getApprovalStatusLabel(sale.approvalStatus)}
                    </span>

                    {sale.rejectionReason && (
                      <small>{sale.rejectionReason}</small>
                    )}
                  </td>

                  <td>{sale.paymentStatus}</td>
                  <td>{sale.items?.length || 0}</td>
                  <td>{formatCurrency(sale.total)}</td>

                  <td>
                    <div className="table-actions">
                      {sale.status === 'rascunho' &&
                        sale.approvalStatus !== 'pendente' &&
                        sale.approvalStatus !== 'aprovado' && (
                          <button
                            type="button"
                            onClick={() => handleRequestApproval(sale)}
                          >
                            Enviar aprovação
                          </button>
                        )}

                      {sale.status === 'rascunho' &&
                        sale.approvalStatus === 'pendente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveSale(sale)}
                            >
                              Aprovar
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => handleRejectSale(sale)}
                            >
                              Reprovar
                            </button>
                          </>
                        )}

                      {sale.status === 'rascunho' && (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleCancelSale(sale)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {sales.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default Vendas;