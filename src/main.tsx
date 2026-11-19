import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => {
        void registration.update();

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void registration.update();
          }
        });
      })
      .catch(() => {
        // Ignore service worker registration failures in development.
      });

    let previousController = navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (previousController) {
        window.location.reload();
      }
      previousController = navigator.serviceWorker.controller;
    });
  });
}
