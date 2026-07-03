function PlaceholderPage({ title, description }) {
  return (
    <section className="placeholder-page">
      <span>Flowtatoo</span>
      <h1>{title}</h1>
      <p>
        {description ||
          'Modulo reservado para a proxima etapa de desenvolvimento do Flowtatoo.'}
      </p>

      <div className="placeholder-box">
        <strong>Em desenvolvimento</strong>
        <p>
          Esta area sera conectada ao backend com cadastro, edicao, filtros,
          permissoes e relatorios.
        </p>
      </div>
    </section>
  );
}

export default PlaceholderPage;