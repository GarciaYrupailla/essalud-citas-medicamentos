import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await login(correo, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesion');
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow-sm" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body p-4">
          <h3 className="text-center mb-1">EsSalud</h3>
          <p className="text-center text-muted">Sistema de Gestion Hospitalaria</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Correo</label>
              <input className="form-control" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Contrasena</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary w-100" type="submit">Ingresar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
