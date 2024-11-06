import React from 'react';
import ReactDOM from 'react-dom/client'; // Изменено на новый API
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Импортируем BrowserRouter
import './global.css';

// Используем createRoot для поддержки React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
