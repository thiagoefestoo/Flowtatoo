import { createContext, useContext, useRef, useState } from 'react';

const AppModalContext = createContext(null);

const initialModal = {
  open: false,
  type: 'alert',
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false,
  inputValue: '',
  placeholder: '',
};

export function AppModalProvider({ children }) {
  const resolverRef = useRef(null);
  const [modal, setModal] = useState(initialModal);

  function closeModal(result) {
    setModal((current) => ({
      ...current,
      open: false,
    }));

    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }

  function alert({
    title = 'Aviso',
    message = '',
    confirmText = 'Ok',
    danger = false,
  }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      setModal({
        ...initialModal,
        open: true,
        type: 'alert',
        title,
        message,
        confirmText,
        danger,
      });
    });
  }

  function confirm({
    title = 'Confirmar ação',
    message = 'Deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false,
  }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      setModal({
        ...initialModal,
        open: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        danger,
      });
    });
  }

  function prompt({
    title = 'Informar valor',
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false,
    defaultValue = '',
    placeholder = '',
  }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      setModal({
        ...initialModal,
        open: true,
        type: 'prompt',
        title,
        message,
        confirmText,
        cancelText,
        danger,
        inputValue: defaultValue,
        placeholder,
      });
    });
  }

  return (
    <AppModalContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {modal.open && (
        <div className="app-modal-backdrop">
          <div className="app-modal-card" role="dialog" aria-modal="true">
            <div className={modal.danger ? 'app-modal-icon danger' : 'app-modal-icon'}>
              {modal.danger ? '!' : '✓'}
            </div>

            <div className="app-modal-content">
              <h2>{modal.title}</h2>

              {modal.message && <p>{modal.message}</p>}

              {modal.type === 'prompt' && (
                <textarea
                  autoFocus
                  value={modal.inputValue}
                  placeholder={modal.placeholder}
                  onChange={(event) =>
                    setModal((current) => ({
                      ...current,
                      inputValue: event.target.value,
                    }))
                  }
                />
              )}
            </div>

            <div className="app-modal-actions">
              {modal.type !== 'alert' && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => closeModal(modal.type === 'prompt' ? null : false)}
                >
                  {modal.cancelText}
                </button>
              )}

              <button
                type="button"
                className={modal.danger ? 'danger-button' : ''}
                onClick={() => {
                  if (modal.type === 'prompt') {
                    closeModal(modal.inputValue);
                    return;
                  }

                  closeModal(true);
                }}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppModalContext.Provider>
  );
}

export function useAppModal() {
  const context = useContext(AppModalContext);

  if (!context) {
    throw new Error('useAppModal precisa estar dentro de AppModalProvider.');
  }

  return context;
}