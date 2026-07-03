import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const EMPTY = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  instagram: '',
  city: '',
  source: 'whatsapp',
  allergies: '',
  medicalNotes: '',
  notes: '',
  status: 'ativo',
};

function TattooClientes() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  async function loadClients() {
    try {
      const result = await apiRequest('/tattoo-clients');
      setClients(extractData(result));
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar clientes.');
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editClient(client) {
    setEditing(client);
    setForm({
      name: client.name || '',
      phone: client.phone || '',
      whatsapp: client.whatsapp || '',
      email: client.email || '',
      instagram: client.instagram || '',
      city: client.city || '',
      source: client.source || 'whatsapp',
      allergies: client.allergies || '',
      medicalNotes: client.medicalNotes || '',
      notes: client.notes || '',
      status: client.status || 'ativo',
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    try {
      if (editing) {
        await apiRequest(`/tattoo-clients/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/tattoo-clients', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm(EMPTY);
      setEditing(null);
      await loadClients();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar cliente.');
    }
  }

  return (
    <div className="tattoo-page">
      <section className="tattoo-hero compact">
        <div>
          <span>CLIENTES</span>
          <h1>Cadastro obrigatório antes do agendamento</h1>
          <p>Todo horário da agenda usa cliente já cadastrado. Isso evita duplicidade e mantém histórico, termos, observações e alertas concentrados.</p>
        </div>
      </section>

      {message && <div className="tattoo-message">{message}</div>}

      <section className="tattoo-two-columns">
        <form className="tattoo-panel tattoo-form" onSubmit={handleSubmit}>
          <div className="tattoo-panel-title">
            <span>{editing ? 'Editar cliente' : 'Novo cliente'}</span>
            <strong>{editing ? editing.name : 'Ficha do cliente'}</strong>
          </div>
          <label>Nome<input name="name" value={form.name} onChange={handleChange} required /></label>
          <label>Telefone<input name="phone" value={form.phone} onChange={handleChange} required /></label>
          <label>WhatsApp<input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="Pode repetir o telefone" /></label>
          <label>E-mail<input type="email" name="email" value={form.email} onChange={handleChange} /></label>
          <label>Instagram<input name="instagram" value={form.instagram} onChange={handleChange} placeholder="@cliente" /></label>
          <label>Cidade<input name="city" value={form.city} onChange={handleChange} /></label>
          <label>Origem
            <select name="source" value={form.source} onChange={handleChange}>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="google">Google</option>
              <option value="retorno">Retorno</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="vip">VIP</option>
              <option value="em_observacao">Em observação</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
          <label>Alergias<textarea name="allergies" value={form.allergies} onChange={handleChange} /></label>
          <label>Observações médicas<textarea name="medicalNotes" value={form.medicalNotes} onChange={handleChange} /></label>
          <button type="submit" className="tattoo-btn primary">{editing ? 'Atualizar cliente' : 'Cadastrar cliente'}</button>
          {editing && <button type="button" className="tattoo-btn ghost" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancelar edição</button>}
        </form>

        <div className="tattoo-panel">
          <div className="tattoo-panel-title">
            <span>Lista suspensa da agenda</span>
            <strong>{clients.length} clientes cadastrados</strong>
          </div>
          <div className="tattoo-card-list">
            {clients.map((client) => (
              <article key={client.id} className="tattoo-list-card">
                <div>
                  <strong>{client.name}</strong>
                  <span>{client.phone} · {client.instagram || 'sem Instagram'}</span>
                  <p>{client.city || 'cidade não informada'} · {client.source}</p>
                </div>
                <button type="button" onClick={() => editClient(client)}>Editar</button>
              </article>
            ))}
            {clients.length === 0 && <div className="tattoo-empty-day"><strong>Nenhum cliente cadastrado.</strong><p>Cadastre o primeiro cliente para liberar a agenda.</p></div>}
          </div>
        </div>
      </section>
    </div>
  );
}

export default TattooClientes;
