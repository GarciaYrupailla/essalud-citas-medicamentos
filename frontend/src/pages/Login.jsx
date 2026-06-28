import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import hospitalLogin from '../assets/img/ChatGPT Image 24 jun 2026, 11_45_32.png';
import essaludLogo from '../assets/img/essalud-logo-png_seeklogo-205729-removebg-preview.png';

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
    <div className="login-page">
      <section className="login-hero" aria-label="Hospital">
        <img src={hospitalLogin} alt="Pasillo de hospital" />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <img className="login-logo" src={essaludLogo} alt="EsSalud" />
          <p className="login-subtitle">Sistema de Gestion Hospitalaria</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Correo</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>
            <div className="login-field">
              <label>Contrasena</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="login-submit" type="submit">Ingresar</button>
          </form>
        </div>
      </section>
    </div>
  );
}
