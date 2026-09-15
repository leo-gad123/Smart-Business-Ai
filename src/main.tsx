import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db } from './services/db';

// Hydrate application state from MongoDB (offline-first: falls back to localStorage if server unavailable)
db.hydrateFromServer().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});