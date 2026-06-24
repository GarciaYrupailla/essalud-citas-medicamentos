import React, { createContext, useContext, useEffect, useState } from 'react';
import { http } from '../api/http.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    http.get('/auth/me')
      .then((response) => setUsuario(response.data.usuario))
      .finally(() => setCargando(false));
  }, []);

  async function login(correo, password) {
    const response = await http.post('/auth/login', { correo, password });
    setUsuario(response.data.usuario);
  }

  async function logout() {
    await http.post('/auth/logout');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
