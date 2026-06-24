import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  IconCalendarCheck,
  IconChartBar,
  IconHeartbeat,
  IconLayoutDashboard,
  IconLogout,
  IconMedicineSyrup,
  IconPill,
  IconStethoscope,
  IconUsers
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-panel">
          <div className="brand-icon"><IconHeartbeat size={28} /></div>
          <div>
            <div className="brand-title">EsSalud</div>
            <div className="brand-subtitle">Gestion Hospitalaria</div>
          </div>
        </div>

        <nav className="nav flex-column app-nav">
          <MenuLink to="/" icon={<IconLayoutDashboard size={20} />} label="Panel principal" />
          <MenuLink to="/pacientes" icon={<IconUsers size={20} />} label="Pacientes" />
          <MenuLink to="/medicos" icon={<IconStethoscope size={20} />} label="Medicos" />
          <MenuLink to="/citas" icon={<IconCalendarCheck size={20} />} label="Citas medicas" />
          <MenuLink to="/medicamentos" icon={<IconPill size={20} />} label="Medicamentos" />
          <MenuLink to="/entregas" icon={<IconMedicineSyrup size={20} />} label="Entregas" />
          <MenuLink to="/reportes" icon={<IconChartBar size={20} />} label="Reportes" />
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <div className="topbar-kicker">Institucion publica de salud</div>
            <strong>Sistema de Gestion de Citas y Control de Medicamentos</strong>
          </div>
          <div className="d-flex align-items-center gap-3 user-actions">
            <div className="text-end">
              <div className="fw-bold">{usuario?.nombre}</div>
              <div className="text-secondary small">Administrador del sistema</div>
            </div>
            <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={logout}>
              <IconLogout size={16} /> Salir
            </button>
          </div>
        </header>
        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function MenuLink({ to, icon, label }) {
  return (
    <NavLink to={to} className="nav-link app-nav-link">
      <span className="nav-link-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
