import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// The entry point for the React application. We mount our App
// component into the root div defined in index.html. Vite handles
// hot reloading during development.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);