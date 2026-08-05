import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// REFRESH TOKEN - uncomment when RefreshTokens table is created
// import { refreshAccessToken, logout, setupSilentRefresh } from './services/authService';
//
// const _fetch = window.fetch;
// window.fetch = async (...args) => {
//   const response = await _fetch(...args);
//   if (response.status === 401) {
//     const url = String(args[0] || "");
//     if (!url.includes("/api/Auth/")) {
//       try {
//         const newToken = await refreshAccessToken();
//         const [input, init = {}] = args;
//         return _fetch(input, {
//           ...init,
//           headers: { ...(init.headers || {}), Authorization: `Bearer ${newToken}` },
//         });
//       } catch {
//         await logout();
//         window.location.href = "/login";
//       }
//     }
//   }
//   return response;
// };
//
// setupSilentRefresh();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
