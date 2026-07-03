import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';
import { getRoleLabel } from '../constants/permissions';

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'rh', label: 'RH' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'operador', label: 'Operador' },
  { value: 'entrevistador', label: 'Entrevistador' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'viewer', label: 'Consulta' },
];

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'viewer',
  status: 'ativo',
  notes: '',
};

function Usuarios() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';

    const [usersResult, statsResult] = await Promise.all([
      apiRequest(`/users${query}`),
      apiRequest('/users/stats'),
    ]);

    setUsers(extractData(usersResult));
    setStats(statsResult.data);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function handleEdit(user) {
    setEditingId(user.id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'viewer',
      status: user.status || 'ativo',
      notes: user.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = { ...form };
      if (editingId && !payload.password) delete payload.password;

      if (editingId) {
        await apiRequest(`/users/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Usuário atualizado com sucesso.');
      } else {
        await apiRequest('/users', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Usuário criado com sucesso.');
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleInactivate(userId) {
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      setMessage('Usuário inativado com sucesso.');
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadUsers();
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>CONTROLE DE ACESSO</span>
          <h1>Usuários</h1>
          <p>Gerencie perfis, status e permissões da operação Flowtatoo.</p>
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article><span>Total</span><strong>{stats?.total || 0}</strong><p>usuários cadastrados</p></article>
        <article><span>Ativos</span><strong>{stats?.ativos || 0}</strong><p>podem acessar o sistema</p></article>
        <article><span>RH</span><strong>{stats?.rhs || 0}</strong><p>usuários de recursos humanos</p></article>
        <article><span>Colaboradores</span><strong>{stats?.colaboradores || 0}</strong><p>acessos internos</p></article>
      </section>

      <section className="form-panel">
        <div className="panel-title">
          <div>
            <h2>{editingId ? 'Editar usuário' : 'Novo usuário'}</h2>
            <p>{editingId ? 'Deixe a senha em branco para manter a atual.' : 'Informe os dados para criar um novo acesso.'}</p>
          </div>
          {editingId && <button className="ghost-button" type="button" onClick={resetForm}>Cancelar edição</button>}
        </div>

        <form className="company-form" onSubmit={handleSubmit}>
          <label>Nome *<input name="name" value={form.name} onChange={handleChange} required /></label>
          <label>E-mail *<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
          <label>Senha {editingId ? '' : '*'}<input type="password" name="password" value={form.password} onChange={handleChange} required={!editingId} /></label>
          <label>
            Perfil
            <select name="role" value={form.role} onChange={handleChange}>
              {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </label>
          <label className="form-full">Observações<textarea name="notes" value={form.notes} onChange={handleChange} rows={3} /></label>
          <div className="form-actions"><button type="submit" disabled={loading}>{loading ? 'Salvando...' : editingId ? 'Atualizar usuário' : 'Cadastrar usuário'}</button></div>
        </form>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Usuários cadastrados</h2>
            <p>Pesquise por nome, perfil ou status.</p>
          </div>
          <form className="filters" onSubmit={handleSearch}>
            <input type="search" placeholder="Buscar usuário" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value }))} />
            <select value={filters.role} onChange={(e) => setFilters((c) => ({ ...c, role: e.target.value }))}>
              <option value="">Perfil</option>
              {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
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
            <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{getRoleLabel(user.role)}</td>
                  <td><span className={`status-badge crm-status-${String(user.status || 'ativo').replaceAll('_', '-')}`}>{user.status}</span></td>
                  <td>
                    <div className="table-actions crm-table-actions-expanded">
                      <button type="button" onClick={() => handleEdit(user)}>Editar</button>
                      <button type="button" className="danger-button" onClick={() => handleInactivate(user.id)}>Inativar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="5" className="empty-table">Nenhum usuário encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Usuarios;
