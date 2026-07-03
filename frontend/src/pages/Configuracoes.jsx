import { useEffect, useState } from 'react';

import { apiRequest } from '../services/api';
import { getLoggedUser, getToken, saveSession } from '../services/auth';

const initialProfile = {
  name: '',
  email: '',
};

const initialPassword = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function Configuracoes() {
  const [profile, setProfile] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState(initialPassword);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  async function loadProfile() {
    try {
      const result = await apiRequest('/auth/me');
      const user = result.data;

      setProfile({
        name: user?.name || '',
        email: user?.email || '',
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    const user = getLoggedUser();

    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
      });
    }

    loadProfile();
  }, []);

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setLoadingProfile(true);
    setMessage('');

    try {
      const result = await apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });

saveSession({
  token: getToken(),
  user: result.data,
});

      setMessage('Perfil atualizado com sucesso.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setLoadingPassword(true);
    setPasswordMessage('');

    try {
      await apiRequest('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(passwordForm),
      });

      setPasswordForm(initialPassword);
      setPasswordMessage('Senha alterada com sucesso.');
    } catch (error) {
      setPasswordMessage(error.message);
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Conta e seguranca</span>
          <h1>Configuracoes</h1>
          <p>Atualize seus dados de acesso e altere sua senha com seguranca.</p>
        </div>
      </div>

      <section className="settings-grid">
        <article className="form-panel">
          <div className="panel-title">
            <div>
              <h2>Meu perfil</h2>
              <p>Dados principais do usuario logado.</p>
            </div>
          </div>

          {message && <div className="module-message">{message}</div>}

          <form className="company-form" onSubmit={handleProfileSubmit}>
            <label>
              Nome *
              <input
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                required
              />
            </label>

            <label>
              E-mail *
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                required
              />
            </label>

            <div className="form-actions">
              <button type="submit" disabled={loadingProfile}>
                {loadingProfile ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        </article>

        <article className="form-panel">
          <div className="panel-title">
            <div>
              <h2>Alterar senha</h2>
              <p>Informe a senha atual e defina uma nova senha.</p>
            </div>
          </div>

          {passwordMessage && <div className="module-message">{passwordMessage}</div>}

          <form className="company-form" onSubmit={handlePasswordSubmit}>
            <label>
              Senha atual *
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>

            <label>
              Nova senha *
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength="6"
              />
            </label>

            <label>
              Confirmar nova senha *
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength="6"
              />
            </label>

            <div className="form-actions">
              <button type="submit" disabled={loadingPassword}>
                {loadingPassword ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}

export default Configuracoes;