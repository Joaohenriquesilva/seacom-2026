import ThemeProvider from './ThemeProvider';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import DefinirSenhaConvite from './DefinirSenhaConvite';
import Checkin from './Checkin';
import './style.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <React.StrictMode><ThemeProvider>
      {new URLSearchParams(window.location.search).has('checkin') ? <Checkin /> : new URLSearchParams(window.location.search).get('auth') === 'invite' ? <DefinirSenhaConvite /> : <App />}
    </ThemeProvider></React.StrictMode>
  );
}
