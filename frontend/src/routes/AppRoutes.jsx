import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CitasList } from '../pages/citas/CitasList.jsx';
import { Dashboard } from '../pages/Dashboard.jsx';
import { EntregasList } from '../pages/entregas/EntregasList.jsx';
import { Login } from '../pages/Login.jsx';
import { MedicamentosList } from '../pages/medicamentos/MedicamentosList.jsx';
import { MedicosList } from '../pages/medicos/MedicosList.jsx';
import { PacientesList } from '../pages/pacientes/PacientesList.jsx';
import { Reportes } from '../pages/reportes/Reportes.jsx';

export function AppRoutes() {
  const { usuario, cargando } = useAuth();

  if (cargando) return <div className="p-4">Cargando...</div>;

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login />} />
      <Route element={usuario ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pacientes" element={<PacientesList />} />
        <Route path="/medicos" element={<MedicosList />} />
        <Route path="/citas" element={<CitasList />} />
        <Route path="/medicamentos" element={<MedicamentosList />} />
        <Route path="/entregas" element={<EntregasList />} />
        <Route path="/reportes" element={<Reportes />} />
      </Route>
    </Routes>
  );
}
