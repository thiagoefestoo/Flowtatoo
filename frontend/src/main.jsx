import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { AppModalProvider } from './components/AppModalProvider';
import './index.css';
import './flowtatoo-theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppModalProvider>
      <App />
    </AppModalProvider>
  </React.StrictMode>
);