import React, { useEffect, useState } from 'react';
import { http } from '../../api/http.js';
import { DataTable } from '../../components/Table/DataTable.jsx';

const emptyForm = {
  dni: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  direccion: ''
};

export function PacientesList() {
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPacientes();
  }, []);

  async function loadPacientes() {
    const response = await http.get('/pacientes');
    setPacientes(response.data);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(paciente) {
    setForm({
      dni: paciente.dni || '',
      nombres: paciente.nombres || '',
      apellidos: paciente.apellidos || '',
      fechaNacimiento: toInputDate(paciente.fechaNacimiento),
      telefono: paciente.telefono || '',
      correo: paciente.correo || '',
      direccion: paciente.direccion || ''
    });
    setEditingId(paciente.idPaciente);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      if (editingId) {
        await http.put(`/pacientes/${editingId}`, form);
      } else {
        await http.post('/pacientes', form);
      }
      setShowForm(false);
      await loadPacientes();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el paciente');
    }
  }

  async function handleDelete(paciente) {
    if (!window.confirm(`Eliminar paciente ${paciente.nombres} ${paciente.apellidos}?`)) return;
    await http.delete(`/pacientes/${paciente.idPaciente}`);
    await loadPacientes();
  }

  return (
    <>
      <PageHeader title="Gestion de Pacientes" button="Nuevo paciente" onClick={openCreate} />
      <div className="card">
        <div className="card-body">
          <DataTable
            rows={pacientes}
            getRowId={(row) => row.idPaciente}
            columns={[
              { key: 'idPaciente', label: 'ID' },
              { key: 'dni', label: 'DNI' },
              { key: 'nombres', label: 'Nombres' },
              { key: 'apellidos', label: 'Apellidos' },
              { key: 'telefono', label: 'Telefono' },
              { key: 'correo', label: 'Correo' },
              {
                key: 'acciones',
                label: 'Acciones',
                render: (row) => <Actions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />
              }
            ]}
          />
        </div>
      </div>

      {showForm && (
        <Modal title={editingId ? 'Editar paciente' : 'Nuevo paciente'} onClose={() => setShowForm(false)}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <Input label="DNI" value={form.dni} maxLength="8" required onChange={(value) => setForm({ ...form, dni: value })} />
              <Input label="Nombres" value={form.nombres} required onChange={(value) => setForm({ ...form, nombres: value })} />
              <Input label="Apellidos" value={form.apellidos} required onChange={(value) => setForm({ ...form, apellidos: value })} />
              <Input label="Fecha de nacimiento" type="date" value={form.fechaNacimiento} onChange={(value) => setForm({ ...form, fechaNacimiento: value })} />
              <Input label="Telefono" value={form.telefono} onChange={(value) => setForm({ ...form, telefono: value })} />
              <Input label="Correo" type="email" value={form.correo} onChange={(value) => setForm({ ...form, correo: value })} />
              <Input label="Direccion" value={form.direccion} onChange={(value) => setForm({ ...form, direccion: value })} />
            </div>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

function PageHeader({ title, button, onClick }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h1 className="h3 mb-0">{title}</h1>
      <button className="btn btn-primary" onClick={onClick}>{button}</button>
    </div>
  );
}

function Actions({ onEdit, onDelete }) {
  return (
    <div className="btn-list flex-nowrap">
      <button className="btn btn-warning btn-sm" onClick={onEdit}>Editar</button>
      <button className="btn btn-danger btn-sm" onClick={onDelete}>Eliminar</button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal modal-blur show d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, required = false, maxLength }) {
  return (
    <div className="col-md-6">
      <label className="form-label">{label}</label>
      <input className="form-control" type={type} value={value} maxLength={maxLength} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function FormActions({ onCancel }) {
  return (
    <div className="mt-4 d-flex justify-content-end gap-2">
      <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
      <button type="submit" className="btn btn-primary">Guardar</button>
    </div>
  );
}

function toInputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}
