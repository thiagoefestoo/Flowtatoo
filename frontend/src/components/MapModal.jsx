function MapModal({ isOpen, title, subtitle, mapUrl, onClose }) {
  if (!isOpen || !mapUrl) return null;

  return (
    <div className="fd-map-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="fd-map-modal-card" role="dialog" aria-modal="true" aria-label={title || 'Mapa'} onClick={(event) => event.stopPropagation()}>
        <div className="fd-map-modal-header">
          <div>
            <span>Mapa interno</span>
            <h2>{title || 'Visualização do mapa'}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="fd-map-modal-close" onClick={onClose} aria-label="Fechar mapa">×</button>
        </div>

        <div className="fd-map-modal-frame-wrap">
          <iframe
            title={title || 'Mapa'}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default MapModal;
