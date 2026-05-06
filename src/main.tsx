import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App'; // TO'G'RI
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
