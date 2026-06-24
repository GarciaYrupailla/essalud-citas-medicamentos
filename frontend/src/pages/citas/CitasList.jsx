import React, { useEffect, useState } from 'react';
import { http } from '../../api/http.js';
import { DataTable } from '../../components/Table/DataTable.jsx';

const emptyForm = { idPaciente: '', idMedico: '', fecha: '', hora: '', motivo: '', estado: 'Pendiente' };

export function CitasList() {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [citasResponse, pacientesResponse, medicosResponse] = await Promise.all([
      http.get('/citas'),
      http.get('/pacientes'),
      http.get('/medicos')
    ]);
    setCitas(citasResponse.data);
    setPacientes(pacientesResponse.data);
    setMedicos(medicosResponse.data);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(cita) {
    setForm({
      idPaciente: cita.idPaciente || '',
      idMedico: cita.idMedico || '',
      fecha: toInputDate(cita.fecha),
      hora: cita.hora || '',
      motivo: cita.motivo || '',
      estado: cita.estado || 'Pendiente'
    });
    setEditingId(cita.idCita);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      if (editingId) await http.put(`/citas/${editingId}`, form);
      else await http.post('/citas', form);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la cita');
    }
  }

  async function handleCancel(cita) {
    if (!window.confirm(`Cancelar cita de ${cita.paciente.nombres} ${cita.paciente.apellidos}?`)) return;
    await http.delete(`/citas/${cita.idCita}`);
    await loadData();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Gestion de Citas</h1>
        <button className="btn btn-info" onClick={openCreate}>Nueva cita</button>
      </div>

      <div className="card"><div className="card-body">
        <DataTable
          rows={citas}
          getRowId={(row) => row.idCita}
          columns={[
            { key: 'idCita', label: 'ID' },
            { key: 'paciente', label: 'Paciente', render: (row) => `${row.paciente.nombres} ${row.paciente.apellidos}` },
            { key: 'medico', label: 'Medico', render: (row) => `${row.medico.nombres} ${row.medico.apellidos}` },
            { key: 'especialidad', label: 'Especialidad', render: (row) => row.medico.especialidad?.nombre },
            { key: 'fecha', label: 'Fecha', render: (row) => formatDate(row.fecha) },
            { key: 'hora', label: 'Hora' },
            { key: 'estado', label: 'Estado', render: (row) => <span className={estadoClass(row.estado)}>{row.estado}</span> },
            { key: 'acciones', label: 'Acciones', render: (row) => <Actions onEdit={() => openEdit(row)} onCancel={() => handleCancel(row)} disabled={row.estado === 'Cancelada'} /> }
          ]}
        />
      </div></div>

      {showForm && (
        <Modal title={editingId ? 'Editar cita' : 'Nueva cita medica'} onClose={() => setShowForm(false)}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <Select label="Paciente" value={form.idPaciente} required onChange={(value) => setForm({ ...form, idPaciente: value })}>
                <option value="">Seleccione un paciente</option>
                {pacientes.map((item) => <option key={item.idPaciente} value={item.idPaciente}>{item.nombres} {item.apellidos} - DNI: {item.dni}</option>)}
              </Select>
              <Select label="Medico" value={form.idMedico} required onChange={(value) => setForm({ ...form, idMedico: value })}>
                <option value="">Seleccione un medico</option>
                {medicos.map((item) => <option key={item.idMedico} value={item.idMedico}>Dr(a). {item.nombres} {item.apellidos} - {item.especialidad?.nombre}</option>)}
              </Select>
              <Input label="Fecha" type="date" value={form.fecha} required onChange={(value) => setForm({ ...form, fecha: value })} />
              <Input label="Hora" type="time" value={form.hora} required onChange={(value) => setForm({ ...form, hora: value })} />
              <Select label="Estado" value={form.estado} required onChange={(value) => setForm({ ...form, estado: value })}>
                <option value="Pendiente">Pendiente</option>
                <option value="Atendida">Atendida</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
              <div className="col-12">
                <label className="form-label">Motivo de la cita</label>
                <textarea className="form-control" rows="3" value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} />
              </div>
            </div>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

function Actions({ onEdit, onCancel, disabled }) {
  return <div className="btn-list flex-nowrap"><button className="btn btn-warning btn-sm" onClick={onEdit}>Editar</button><button className="btn btn-danger btn-sm" disabled={disabled} onClick={onCancel}>Cancelar</button></div>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal modal-blur show d-block" tabIndex="-1"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">{title}</h5><button type="button" className="btn-close" onClick={onClose} /></div><div className="modal-body">{children}</div></div></div></div>;
}

function Input({ label, type = 'text', value, onChange, required = false }) {
  return <div className="col-md-6"><label className="form-label">{label}</label><input className="form-control" type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Select({ label, value, onChange, required = false, children }) {
  return <div className="col-md-6"><label className="form-label">{label}</label><select className="form-select" value={value} required={required} onChange={(event) => onChange(event.target.value)}>{children}</select></div>;
}

function FormActions({ onCancel }) {
  return <div className="mt-4 d-flex justify-content-end gap-2"><button type="button" className="btn" onClick={onCancel}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar</button></div>;
}

function toInputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-PE');
}

function estadoClass(estado) {
  if (estado === 'Atendida') return 'badge bg-success-lt';
  if (estado === 'Cancelada') return 'badge bg-secondary-lt';
  return 'badge bg-blue-lt';
}
