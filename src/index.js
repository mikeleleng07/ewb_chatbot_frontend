import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Polyfill structuredClone
if (typeof structuredClone === 'undefined') {
  window.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// Mount React
const container = document.getElementById('webchat');
if (!container) console.error('Webchat container not found!');
else
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
