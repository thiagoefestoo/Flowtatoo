import { useEffect, useState } from 'react';

import { apiRequest, extractData } from '../services/api';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  instagram: '',
  specialties: '',
  commissionPercent: 50,
  color: '#7c3aed',
  status: 'ativo',
  notes: '',
};

function TattooArtistas() {
  const [artists, setArtists] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  async function loadArtists() {
    try {
      const result = await apiRequest('/tattoo-artists');
      setArtists(extractData(result));
    } catch (error) {
      setMessage(error.message || 'Erro ao carregar perfil artístico.');
    }
  }

  useEffect(() => {
    loadArtists();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editArtist(artist) {
    setEditing(artist);
    setForm({
      name: artist.name || '',
      phone: artist.phone || '',
      email: artist.email || '',
      instagram: artist.instagram || '',
      specialties: artist.specialties || '',
      commissionPercent: artist.commissionPercent || 50,
      color: artist.color || '#7c3aed',
      status: artist.status || 'ativo',
      notes: artist.notes || '',
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    try {
      const payload = { ...form, commissionPercent: Number(form.commissionPercent || 0) };
      if (editing) {
        await apiRequest(`/tattoo-artists/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/tattoo-artists', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm(EMPTY);
      setEditing(null);
      await loadArtists();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar perfil artístico.');
    }
  }

  return (
    <div className="tattoo-page">
      <section className="tattoo-hero compact">
        <div>
          <span>MEU PERFIL</span>
          <h1>Perfil artístico do estúdio</h1>
          <p>Cadastre seu nome profissional, especialidades, cor na agenda e comissão/base de controle para organizar seus horários e faturamento.</p>
        </div>
      </section>

      {message && <div className="tattoo-message">{message}</div>}

      <section className="tattoo-two-columns">
        <form className="tattoo-panel tattoo-form" onSubmit={handleSubmit}>
          <div className="tattoo-panel-title">
            <span>{editing ? 'Editar perfil' : 'Meu cadastro artístico'}</span>
            <strong>{editing ? editing.name : 'Perfil profissional'}</strong>
          </div>
          <label>Nome<input name="name" value={form.name} onChange={handleChange} required /></label>
          <label>Telefone<input name="phone" value={form.phone} onChange={handleChange} /></label>
          <label>E-mail<input type="email" name="email" value={form.email} onChange={handleChange} /></label>
          <label>Instagram<input name="instagram" value={form.instagram} onChange={handleChange} placeholder="@seuestudio" /></label>
          <label>Especialidades<input name="specialties" value={form.specialties} onChange={handleChange} placeholder="fineline, blackwork..." /></label>
          <label>Comissão %<input type="number" min="0" max="100" step="0.01" name="commissionPercent" value={form.commissionPercent} onChange={handleChange} /></label>
          <label>Cor na agenda<input type="color" name="color" value={form.color} onChange={handleChange} /></label>
          <label>Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativo">Ativo</option>
              <option value="folga">Folga</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
          <label>Observações<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          <button type="submit" className="tattoo-btn primary">{editing ? 'Atualizar perfil' : 'Salvar perfil'}</button>
          {editing && <button type="button" className="tattoo-btn ghost" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancelar edição</button>}
        </form>

        <div className="tattoo-panel">
          <div className="tattoo-panel-title">
            <span>Perfil ativo</span>
            <strong>{artists.length} perfil(is) cadastrado(s)</strong>
          </div>
          <div className="tattoo-artist-grid">
            {artists.map((artist) => (
              <article key={artist.id} className="tattoo-artist-card" style={{ '--artist-color': artist.color || '#7c3aed' }}>
                <i />
                <strong>{artist.name}</strong>
                <span>{artist.specialties || 'Especialidade não informada'}</span>
                <p>{artist.instagram || 'sem Instagram'} · {artist.commissionPercent || 0}% comissão</p>
                <button type="button" onClick={() => editArtist(artist)}>Editar</button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default TattooArtistas;
