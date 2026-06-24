import React, { useEffect, useState } from 'react';
import { http } from '../../api/http.js';
import { DataTable } from '../../components/Table/DataTable.jsx';

const emptyForm = { idEspecialidad: '', nombres: '', apellidos: '', cmp: '', telefono: '', correo: '' };

export function MedicosList() {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [medicosResponse, especialidadesResponse] = await Promise.all([
      http.get('/medicos'),
      http.get('/medicos/especialidades')
    ]);
    setMedicos(medicosResponse.data);
    setEspecialidades(especialidadesResponse.data);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(medico) {
    setForm({
      idEspecialidad: medico.idEspecialidad || '',
      nombres: medico.nombres || '',
      apellidos: medico.apellidos || '',
      cmp: medico.cmp || '',
      telefono: medico.telefono || '',
      correo: medico.correo || ''
    });
    setEditingId(medico.idMedico);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      if (editingId) await http.put(`/medicos/${editingId}`, form);
      else await http.post('/medicos', form);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el medico');
    }
  }

  async function handleDelete(medico) {
    if (!window.confirm(`Eliminar medico ${medico.nombres} ${medico.apellidos}?`)) return;
    await http.delete(`/medicos/${medico.idMedico}`);
    await loadData();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Gestion de Medicos</h1>
        <button className="btn btn-success" onClick={openCreate}>Nuevo medico</button>
      </div>

      <div className="card"><div className="card-body">
        <DataTable
          rows={medicos}
          getRowId={(row) => row.idMedico}
          columns={[
            { key: 'idMedico', label: 'ID' },
            { key: 'medico', label: 'Medico', render: (row) => `${row.nombres} ${row.apellidos}` },
            { key: 'especialidad', label: 'Especialidad', render: (row) => row.especialidad?.nombre },
            { key: 'cmp', label: 'CMP' },
            { key: 'telefono', label: 'Telefono' },
            { key: 'correo', label: 'Correo' },
            { key: 'acciones', label: 'Acciones', render: (row) => <Actions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} /> }
          ]}
        />
      </div></div>

      {showForm && (
        <Modal title={editingId ? 'Editar medico' : 'Nuevo medico'} onClose={() => setShowForm(false)}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Especialidad</label>
                <select className="form-select" required value={form.idEspecialidad} onChange={(event) => setForm({ ...form, idEspecialidad: event.target.value })}>
                  <option value="">Seleccione una especialidad</option>
                  {especialidades.map((item) => <option key={item.idEspecialidad} value={item.idEspecialidad}>{item.nombre}</option>)}
                </select>
              </div>
              <Input label="Nombres" value={form.nombres} required onChange={(value) => setForm({ ...form, nombres: value })} />
              <Input label="Apellidos" value={form.apellidos} required onChange={(value) => setForm({ ...form, apellidos: value })} />
              <Input label="CMP" value={form.cmp} onChange={(value) => setForm({ ...form, cmp: value })} />
              <Input label="Telefono" value={form.telefono} onChange={(value) => setForm({ ...form, telefono: value })} />
              <Input label="Correo" type="email" value={form.correo} onChange={(value) => setForm({ ...form, correo: value })} />
            </div>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

function Actions({ onEdit, onDelete }) {
  return <div className="btn-list flex-nowrap"><button className="btn btn-warning btn-sm" onClick={onEdit}>Editar</button><button className="btn btn-danger btn-sm" onClick={onDelete}>Eliminar</button></div>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal modal-blur show d-block" tabIndex="-1"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">{title}</h5><button type="button" className="btn-close" onClick={onClose} /></div><div className="modal-body">{children}</div></div></div></div>;
}

function Input({ label, type = 'text', value, onChange, required = false }) {
  return <div className="col-md-6"><label className="form-label">{label}</label><input className="form-control" type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></div>;
}

function FormActions({ onCancel }) {
  return <div className="mt-4 d-flex justify-content-end gap-2"><button type="button" className="btn" onClick={onCancel}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar</button></div>;
}
