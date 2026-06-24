import React, { useEffect, useState } from 'react';
import { http } from '../../api/http.js';
import { DataTable } from '../../components/Table/DataTable.jsx';

const emptyForm = { nombre: '', descripcion: '', stock: 0, stockMinimo: 10, fechaVencimiento: '' };

export function MedicamentosList() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadMedicamentos(); }, []);

  async function loadMedicamentos() {
    const response = await http.get('/medicamentos');
    setMedicamentos(response.data);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(medicamento) {
    setForm({
      nombre: medicamento.nombre || '',
      descripcion: medicamento.descripcion || '',
      stock: medicamento.stock ?? 0,
      stockMinimo: medicamento.stockMinimo ?? 10,
      fechaVencimiento: toInputDate(medicamento.fechaVencimiento)
    });
    setEditingId(medicamento.idMedicamento);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      if (editingId) await http.put(`/medicamentos/${editingId}`, form);
      else await http.post('/medicamentos', form);
      setShowForm(false);
      await loadMedicamentos();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el medicamento');
    }
  }

  async function handleDelete(medicamento) {
    if (!window.confirm(`Eliminar medicamento ${medicamento.nombre}?`)) return;
    await http.delete(`/medicamentos/${medicamento.idMedicamento}`);
    await loadMedicamentos();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Control de Medicamentos</h1>
        <button className="btn btn-danger" onClick={openCreate}>Nuevo medicamento</button>
      </div>

      <div className="card"><div className="card-body">
        <DataTable
          rows={medicamentos}
          getRowId={(row) => row.idMedicamento}
          columns={[
            { key: 'idMedicamento', label: 'ID' },
            { key: 'nombre', label: 'Medicamento' },
            { key: 'descripcion', label: 'Descripcion' },
            { key: 'stock', label: 'Stock' },
            { key: 'stockMinimo', label: 'Stock minimo' },
            { key: 'fechaVencimiento', label: 'Vencimiento', render: (row) => formatDate(row.fechaVencimiento) },
            { key: 'alerta', label: 'Alerta', render: (row) => <span className={row.stock <= row.stockMinimo ? 'badge bg-danger-lt' : 'badge bg-success-lt'}>{row.stock <= row.stockMinimo ? 'Stock bajo' : 'Stock normal'}</span> },
            { key: 'acciones', label: 'Acciones', render: (row) => <Actions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} /> }
          ]}
        />
      </div></div>

      {showForm && (
        <Modal title={editingId ? 'Editar medicamento' : 'Nuevo medicamento'} onClose={() => setShowForm(false)}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <Input label="Nombre del medicamento" value={form.nombre} required onChange={(value) => setForm({ ...form, nombre: value })} />
              <Input label="Stock" type="number" value={form.stock} required min="0" onChange={(value) => setForm({ ...form, stock: value })} />
              <Input label="Stock minimo" type="number" value={form.stockMinimo} required min="0" onChange={(value) => setForm({ ...form, stockMinimo: value })} />
              <Input label="Fecha de vencimiento" type="date" value={form.fechaVencimiento} onChange={(value) => setForm({ ...form, fechaVencimiento: value })} />
              <div className="col-12">
                <label className="form-label">Descripcion</label>
                <textarea className="form-control" rows="3" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
              </div>
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

function Input({ label, type = 'text', value, onChange, required = false, min }) {
  return <div className="col-md-6"><label className="form-label">{label}</label><input className="form-control" type={type} value={value} required={required} min={min} onChange={(event) => onChange(event.target.value)} /></div>;
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
