import React from 'react';
import ReactDOM from 'react-dom/client';
import TryOnApp from './TryOnApp';
import './index.css';

declare global {
  interface Window {
    TryOnWidget: {
      init: (options: { tenantId: string; productId: string }) => void;
    };
  }
}

window.TryOnWidget = {
  init: ({ tenantId, productId }) => {
    const containerId = 'trail-tryon-widget-root';
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'tryon-widget-container';
      document.body.appendChild(container);
    }

    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <TryOnApp tenantId={tenantId} productId={productId} />
      </React.StrictMode>
    );
  },
};
