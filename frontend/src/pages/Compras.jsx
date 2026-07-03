import { useEffect, useMemo, useState } from 'react';

import { apiRequest, extractData } from '../services/api';
import { useAppModal } from '../components/AppModalProvider';


const emptyForm = {
  supplierId: '',
  number: '',
  issueDate: new Date().toISOString().slice(0, 10),
  paymentStatus: 'pendente',
  discount: '',
  freight: '',
  notes: '',
};

const emptyItem = {
  productId: '',
  quantity: 1,
  unitCost: '',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR');
}

function Compras() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [items, setItems] = useState([]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { confirm, prompt } = useAppModal();
  const [detailModal, setDetailModal] = useState({
  open: false,
  purchase: null,
  auditLogs: [],
});

const [detailLoading, setDetailLoading] = useState(false);

  async function loadPurchases() {
    const result = await apiRequest('/purchases');
    setPurchases(extractData(result));
  }

  async function loadStats() {
    const result = await apiRequest('/purchases/stats');
    setStats(result.data || {});
  }

  async function loadSuppliers() {
    const result = await apiRequest('/suppliers?status=ativo');
    setSuppliers(extractData(result));
  }

  async function loadProducts() {
    const result = await apiRequest('/products?status=ativo');
    setProducts(extractData(result));
  }

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadPurchases(),
        loadStats(),
        loadSuppliers(),
        loadProducts(),
      ]);
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar compras.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

function handleChange(event) {
  const { name, value } = event.target;

  if (name === 'supplierId') {
    setItemForm(emptyItem);
    setItems([]);
  }

  setForm((current) => ({
    ...current,
    [name]: value,
  }));
}

  function handleItemChange(event) {
    const { name, value } = event.target;

    setItemForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAddItem() {
    setMessage('');

    if (!itemForm.productId) {
      setMessage('Selecione um produto para adicionar.');
      return;
    }

    const product = supplierProducts.find((item) => item.id === itemForm.productId);

    if (!product) {
      setMessage('Produto nao encontrado.');
      return;
    }

    const quantity = Number(itemForm.quantity || 0);
    const unitCost = Number(itemForm.unitCost || product.costPrice || 0);

    if (quantity <= 0) {
      setMessage('A quantidade precisa ser maior que zero.');
      return;
    }

    if (unitCost <= 0) {
      setMessage('O custo unitario precisa ser maior que zero.');
      return;
    }

    setItems((current) => [
      ...current,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity,
        unitCost,
        total: quantity * unitCost,
      },
    ]);

    setItemForm(emptyItem);
  }

  function handleRemoveItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

function resetForm() {
  setForm({
    ...emptyForm,
    issueDate: new Date().toISOString().slice(0, 10),
  });
  setItemForm(emptyItem);
  setItems([]);
}

async function openDetailModal(purchase) {
  try {
    setDetailLoading(true);

    setDetailModal({
      open: true,
      purchase,
      auditLogs: [],
    });

    const result = await apiRequest(
      `/audit-logs?entityType=purchase&entityId=${purchase.id}`
    );

    setDetailModal({
      open: true,
      purchase,
      auditLogs: extractData(result),
    });
  } catch (error) {
    setMessage(error.message || 'Erro ao carregar detalhes da compra.');
  } finally {
    setDetailLoading(false);
  }
}

function closeDetailModal() {
  setDetailModal({
    open: false,
    purchase: null,
    auditLogs: [],
  });
}

async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (items.length === 0) {
        setMessage('Adicione pelo menos um item na compra.');
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        discount: Number(form.discount || 0),
        freight: Number(form.freight || 0),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          unitCost: Number(item.unitCost || 0),
        })),
      };

      const result = await apiRequest('/purchases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(result.message || 'Compra criada com sucesso.');
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || 'Erro ao criar compra.');
    } finally {
      setLoading(false);
    }
  }

async function handleRequestApproval(purchase) {
  const confirmed = await confirm({
    title: 'Enviar para aprovação',
    message: `Deseja enviar a compra ${purchase.number} para aprovação?`,
    confirmText: 'Enviar para aprovação',
    cancelText: 'Voltar',
  });

  if (!confirmed) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/purchases/${purchase.id}/request-approval`, {
      method: 'PATCH',
    });

    setMessage(result.message || 'Compra enviada para aprovação.');
    await loadData();
  } catch (error) {
    setMessage(error.message || 'Erro ao enviar compra para aprovação.');
  } finally {
    setLoading(false);
  }
}

async function handleApprove(purchase) {
  const confirmed = await confirm({
    title: 'Aprovar compra',
    message: `Aprovar a compra ${purchase.number}? Isso vai atualizar o estoque e gerar o financeiro automaticamente.`,
    confirmText: 'Aprovar compra',
    cancelText: 'Voltar',
  });

  if (!confirmed) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/purchases/${purchase.id}/approve`, {
      method: 'PATCH',
    });

    setMessage(result.message || 'Compra aprovada com sucesso.');
    await loadData();
  } catch (error) {
    setMessage(error.message || 'Erro ao aprovar compra.');
  } finally {
    setLoading(false);
  }
}

async function handleReject(purchase) {
  const reason = await prompt({
    title: 'Reprovar compra',
    message: `Informe o motivo da reprovação da compra ${purchase.number}.`,
    defaultValue: 'Compra reprovada.',
    placeholder: 'Digite o motivo da reprovação...',
    confirmText: 'Reprovar compra',
    cancelText: 'Voltar',
    danger: true,
  });

  if (reason === null) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/purchases/${purchase.id}/reject-approval`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason,
      }),
    });

    setMessage(result.message || 'Compra reprovada com sucesso.');
    await loadData();
  } catch (error) {
    setMessage(error.message || 'Erro ao reprovar compra.');
  } finally {
    setLoading(false);
  }
}

async function handleCancel(purchase) {
  const confirmed = await confirm({
    title: 'Cancelar compra',
    message: purchase.status === 'confirmada'
      ? `Cancelar a compra ${purchase.number}? O sistema fará o estorno do estoque e cancelará o financeiro gerado.`
      : `Deseja cancelar a compra ${purchase.number}?`,
    confirmText: 'Cancelar compra',
    cancelText: 'Voltar',
    danger: true,
  });

  if (!confirmed) return;

  try {
    setLoading(true);

    const result = await apiRequest(`/purchases/${purchase.id}/cancel`, {
      method: 'PATCH',
    });

    setMessage(result.message || 'Compra cancelada com sucesso.');
    await loadData();
  } catch (error) {
    setMessage(error.message || 'Erro ao cancelar compra.');
  } finally {
    setLoading(false);
  }
}

  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const total = subtotal - Number(form.discount || 0) + Number(form.freight || 0);

const supplierProducts = useMemo(() => {
  if (!form.supplierId) return [];

  return products.filter((product) => product.supplierId === form.supplierId);
}, [products, form.supplierId]);
  return (
    <section className="module-page">
      <div className="page-header">
        <div>
          <span>Suprimentos</span>
          <h1>Compras</h1>
          <p>
            Crie compras, envie para aprovacao e confirme entrada no estoque e financeiro.
          </p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}
      {detailModal.open && (
  <div className="app-modal-backdrop">
    <div className="app-modal-card purchase-detail-modal" role="dialog" aria-modal="true">
      <div className="app-modal-icon">
        i
      </div>

      <div className="app-modal-content">
        <h2>Detalhes da compra</h2>
        <p>
          Consulte os dados da compra, itens e histórico de aprovação.
        </p>

        <div className="purchase-detail-grid">
          <div>
            <span>Número</span>
            <strong>{detailModal.purchase?.number || '-'}</strong>
          </div>

          <div>
            <span>Fornecedor</span>
            <strong>
              {detailModal.purchase?.supplier?.tradeName ||
                detailModal.purchase?.supplier?.name ||
                '-'}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{detailModal.purchase?.status || '-'}</strong>
          </div>

          <div>
            <span>Aprovação</span>
            <strong>{detailModal.purchase?.approvalStatus || 'nao_enviado'}</strong>
          </div>

          <div>
            <span>Pagamento</span>
            <strong>{detailModal.purchase?.paymentStatus || '-'}</strong>
          </div>

          <div>
            <span>Emissão</span>
            <strong>{detailModal.purchase?.issueDate || '-'}</strong>
          </div>

          <div>
            <span>Total</span>
            <strong>{formatCurrency(detailModal.purchase?.total)}</strong>
          </div>

          <div>
            <span>Itens</span>
            <strong>{detailModal.purchase?.items?.length || 0}</strong>
          </div>
        </div>

        <div className="purchase-items-detail-box">
          <div className="purchase-detail-title">
            <strong>Itens da compra</strong>
            <span>{detailModal.purchase?.items?.length || 0} item(ns)</span>
          </div>

          <div className="purchase-items-detail-list">
            {(detailModal.purchase?.items || []).map((item) => (
              <div className="purchase-items-detail-row" key={item.id || item.productId}>
                <div>
                  <strong>
                    {item.product?.sku ? `${item.product.sku} - ` : ''}
                    {item.product?.name || item.name || 'Produto'}
                  </strong>
                  <span>
                    Quantidade: {item.quantity} · Custo unitário: {formatCurrency(item.unitCost)}
                  </span>
                </div>

                <strong>{formatCurrency(item.total)}</strong>
              </div>
            ))}

            {(detailModal.purchase?.items || []).length === 0 && (
              <p>Nenhum item encontrado para esta compra.</p>
            )}
          </div>
        </div>

        <div className="financial-audit-box">
          <div className="financial-audit-title">
            <strong>Histórico da compra</strong>
            <span>
              {detailLoading
                ? 'Carregando...'
                : `${detailModal.auditLogs.length} evento(s)`}
            </span>
          </div>

          <div className="financial-audit-list">
            {detailModal.auditLogs.map((log) => (
              <div className="financial-audit-row" key={log.id}>
                <div>
                  <strong>{log.description}</strong>
                  <span>{formatDateTime(log.createdAt)}</span>
                </div>

                <small>{log.user?.name || 'Sistema'}</small>
              </div>
            ))}

            {!detailLoading && detailModal.auditLogs.length === 0 && (
              <p>Nenhum histórico encontrado para esta compra.</p>
            )}
          </div>
        </div>
      </div>

      <div className="app-modal-actions">
        <button type="button" className="ghost-button" onClick={closeDetailModal}>
          Fechar
        </button>
      </div>
    </div>
  </div>
)}

      <section className="kpi-grid">
        <article>
          <span>Total</span>
          <strong>{stats?.total || 0}</strong>
          <p>Compras cadastradas</p>
        </article>

        <article>
          <span>Pendentes</span>
          <strong>{stats?.pendentesAprovacao || 0}</strong>
          <p>Aguardando aprovacao</p>
        </article>

        <article>
          <span>Confirmadas</span>
          <strong>{stats?.confirmadas || 0}</strong>
          <p>Compras aprovadas</p>
        </article>

        <article>
          <span>Total comprado</span>
          <strong>{formatCurrency(stats?.totalComprado)}</strong>
          <p>Compras confirmadas</p>
        </article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>Nova compra</h2>
            <p>A compra sera criada como rascunho e depois podera ser enviada para aprovacao.</p>
          </div>
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>
            Fornecedor *
            <select
              name="supplierId"
              value={form.supplierId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.tradeName || supplier.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Numero
            <input
              name="number"
              value={form.number}
              onChange={handleChange}
              placeholder="Gerado automaticamente se vazio"
            />
          </label>

          <label>
            Data emissao
            <input
              type="date"
              name="issueDate"
              value={form.issueDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Status pagamento
            <select
              name="paymentStatus"
              value={form.paymentStatus}
              onChange={handleChange}
            >
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="pago">Pago</option>
            </select>
          </label>

          <label>
            Desconto
            <input
              type="number"
              step="0.01"
              name="discount"
              value={form.discount}
              onChange={handleChange}
            />
          </label>

          <label>
            Frete
            <input
              type="number"
              step="0.01"
              name="freight"
              value={form.freight}
              onChange={handleChange}
            />
          </label>

          <label className="form-full">
            Observacoes
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </label>

          <div className="form-full purchase-items-box">
            <div className="purchase-items-title">
              <strong>Itens da compra</strong>
              <span>Total: {formatCurrency(total)}</span>
            </div>

            <div className="purchase-item-form">
<select
  name="productId"
  value={itemForm.productId}
  onChange={handleItemChange}
  disabled={!form.supplierId}
>
  <option value="">
    {!form.supplierId ? 'Selecione o fornecedor primeiro...' : 'Produto...'}
  </option>

  {supplierProducts.map((product) => (
    <option key={product.id} value={product.id}>
      {product.sku} - {product.name}
    </option>
  ))}
</select>
{form.supplierId && supplierProducts.length === 0 && (
  <small>
    Nenhum produto vinculado a este fornecedor. Vá em Produtos e vincule materiais a este fornecedor.
  </small>
)}
              <input
                type="number"
                min="0"
                step="0.001"
                name="quantity"
                value={itemForm.quantity}
                onChange={handleItemChange}
                placeholder="Qtd"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                name="unitCost"
                value={itemForm.unitCost}
                onChange={handleItemChange}
                placeholder="Custo unit."
              />

              <button type="button" onClick={handleAddItem}>
                Adicionar
              </button>
            </div>

            <div className="purchase-items-list">
              {items.map((item, index) => (
                <div className="purchase-item-row" key={`${item.productId}-${index}`}>
                  <div>
                    <strong>{item.sku} - {item.name}</strong>
                    <span>
                      {item.quantity} x {formatCurrency(item.unitCost)}
                    </span>
                  </div>

                  <strong>{formatCurrency(item.total)}</strong>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleRemoveItem(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}

              {items.length === 0 && (
                <small>Nenhum item adicionado.</small>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar compra rascunho'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Compras cadastradas</h2>
            <p>{purchases.length} resultado(s)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Compra</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th>Aprovacao</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Itens</th>
                <th>Acoes</th>
              </tr>
            </thead>

            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>
                    <strong>{purchase.number}</strong>
                    <span>{purchase.issueDate}</span>
                  </td>

                  <td>{purchase.supplier?.tradeName || purchase.supplier?.name || '-'}</td>

                  <td>
                    <span className={`status-badge purchase-${purchase.status}`}>
                      {purchase.status}
                    </span>
                  </td>

                  <td>
                    <span className={`status-badge approval-${purchase.approvalStatus}`}>
                      {purchase.approvalStatus || 'nao_enviado'}
                    </span>
                  </td>

                  <td>{purchase.paymentStatus}</td>

                  <td>{formatCurrency(purchase.total)}</td>

                  <td>{purchase.items?.length || 0}</td>

                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => openDetailModal(purchase)}>
  Detalhes
</button>
                      {purchase.status === 'rascunho' &&
                        ['nao_enviado', 'reprovado', null, undefined].includes(purchase.approvalStatus) && (
                          
                          <button
                            type="button"
                            onClick={() => handleRequestApproval(purchase)}
                          >
                            Enviar aprovacao
                          </button>
                        )}

                      {purchase.status === 'rascunho' &&
                        purchase.approvalStatus === 'pendente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(purchase)}
                            >
                              Aprovar
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => handleReject(purchase)}
                            >
                              Reprovar
                            </button>
                          </>
                        )}

                      {purchase.status === 'rascunho' &&
                        purchase.approvalStatus !== 'pendente' && (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => handleCancel(purchase)}
                          >
                            Cancelar
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}

              {purchases.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Nenhuma compra encontrada.
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

export default Compras;