import { useEffect, useState } from 'react';

import { apiRequest, extractData, getApiFileUrl } from '../services/api';

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Comprovantes() {
  const [proofs, setProofs] = useState([]);
  const [message, setMessage] = useState('');

  async function loadProofs() {
    try {
      const result = await apiRequest('/deliveries/proofs');
      setProofs(extractData(result));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadProofs();
  }, []);

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <span>Confirmação operacional</span>
          <h1>Comprovantes</h1>
          <p>Consulte fotos, documentos e evidências enviadas pelos entregadores no encerramento das entregas.</p>
        </div>
        <button type="button" className="ghost-button" onClick={loadProofs}>Atualizar</button>
      </div>

      {message && <div className="module-message">{message}</div>}

      <section className="kpi-grid">
        <article><span>Comprovantes</span><strong>{proofs.length}</strong><p>arquivos recebidos</p></article>
        <article><span>Entregas comprovadas</span><strong>{new Set(proofs.map((item) => item.entityId)).size}</strong><p>ordens com evidência</p></article>
      </section>

      <section className="list-panel">
        <div className="panel-title">
          <div>
            <h2>Arquivos registrados</h2>
            <p>Abra o comprovante e confira entrega, cliente, responsável e data de envio.</p>
          </div>
        </div>

        <div className="document-list-panel">
          {proofs.map((proof) => (
            <article className="document-list-item" key={proof.id}>
              <div>
                <strong>{proof.originalName}</strong>
                <span>{proof.delivery?.title || 'Entrega'} · {proof.delivery?.customer?.name || 'Cliente'} · {formatFileSize(proof.sizeBytes)}</span>
                <small>{proof.notes || 'Comprovante de entrega'}</small>
              </div>
              <div>
                <span>{proof.uploadedByUser?.name || 'Usuário'}</span>
                <a href={getApiFileUrl(proof.filePath)} target="_blank" rel="noreferrer">Abrir</a>
              </div>
            </article>
          ))}

          {proofs.length === 0 && <div className="empty-documents">Nenhum comprovante registrado ainda.</div>}
        </div>
      </section>
    </div>
  );
}

export default Comprovantes;
