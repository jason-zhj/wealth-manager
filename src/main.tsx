import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// GitHub Pages SPA redirect handling
// 404.html redirects to /?p=<encoded-path>
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('p');
if (redirectPath) {
  const newUrl = window.location.origin + redirectPath;
  window.history.replaceState(null, '', newUrl);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
