import { Link } from 'react-router-dom';

function AcessoNegado() {
  return (
    <section className="placeholder-page">
      <span>Permissao insuficiente</span>
      <h1>Acesso negado</h1>
      <p>
        Seu perfil nao possui permissao para acessar esta area do Flowtatoo.
      </p>

      <div className="placeholder-box">
        <strong>Area protegida</strong>
        <p>
          Caso precise acessar este modulo, solicite liberacao para um usuario administrador.
        </p>

        <Link className="page-link-button" to="/">
          Voltar para o dashboard
        </Link>
      </div>
    </section>
  );
}

export default AcessoNegado;