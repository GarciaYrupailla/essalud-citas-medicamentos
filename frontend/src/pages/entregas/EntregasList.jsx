import React, { useEffect, useState } from 'react';
import { http } from '../../api/http.js';
import { DataTable } from '../../components/Table/DataTable.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const emptyForm = { idPaciente: '', idMedicamento: '', cantidad: 1, responsable: '', observacion: '' };

export function EntregasList() {
  const { usuario } = useAuth();
  const [entregas, setEntregas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [entregasResponse, pacientesResponse, medicamentosResponse] = await Promise.all([
      http.get('/entregas'),
      http.get('/pacientes'),
      http.get('/medicamentos')
    ]);
    setEntregas(entregasResponse.data);
    setPacientes(pacientesResponse.data);
    setMedicamentos(medicamentosResponse.data);
  }

  function openCreate() {
    setForm({ ...emptyForm, responsable: usuario?.nombre || '' });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await http.post('/entregas', form);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar la entrega');
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Entrega de Medicamentos</h1>
        <button className="btn btn-primary" onClick={openCreate}>Nueva entrega</button>
      </div>

      <div className="card"><div className="card-body">
        <DataTable
          rows={entregas}
          getRowId={(row) => row.idEntrega}
          columns={[
            { key: 'idEntrega', label: 'ID' },
            { key: 'paciente', label: 'Paciente', render: (row) => `${row.paciente.nombres} ${row.paciente.apellidos}` },
            { key: 'dni', label: 'DNI', render: (row) => row.paciente.dni },
            { key: 'medicamento', label: 'Medicamento', render: (row) => row.medicamento.nombre },
            { key: 'cantidad', label: 'Cantidad', render: (row) => <span className="badge bg-info-lt">{row.cantidad}</span> },
            { key: 'responsable', label: 'Responsable' },
            { key: 'fechaEntrega', label: 'Fecha', render: (row) => formatDate(row.fechaEntrega) }
          ]}
        />
      </div></div>

      {showForm && (
        <Modal title="Nueva entrega de medicamento" onClose={() => setShowForm(false)}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <Select label="Paciente" value={form.idPaciente} required onChange={(value) => setForm({ ...form, idPaciente: value })}>
                <option value="">Seleccione un paciente</option>
                {pacientes.map((item) => <option key={item.idPaciente} value={item.idPaciente}>{item.nombres} {item.apellidos} - DNI: {item.dni}</option>)}
              </Select>
              <Select label="Medicamento" value={form.idMedicamento} required onChange={(value) => setForm({ ...form, idMedicamento: value })}>
                <option value="">Seleccione un medicamento</option>
                {medicamentos.map((item) => <option key={item.idMedicamento} value={item.idMedicamento}>{item.nombre} - Stock disponible: {item.stock}</option>)}
              </Select>
              <Input label="Cantidad" type="number" min="1" value={form.cantidad} required onChange={(value) => setForm({ ...form, cantidad: value })} />
              <Input label="Responsable" value={form.responsable} required onChange={(value) => setForm({ ...form, responsable: value })} />
              <div className="col-12">
                <label className="form-label">Observacion</label>
                <textarea className="form-control" rows="3" value={form.observacion} onChange={(event) => setForm({ ...form, observacion: event.target.value })} />
              </div>
            </div>
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose }) {
  return <div className="modal modal-blur show d-block" tabIndex="-1"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">{title}</h5><button type="button" className="btn-close" onClick={onClose} /></div><div className="modal-body">{children}</div></div></div></div>;
}

function Input({ label, type = 'text', value, onChange, required = false, min }) {
  return <div className="col-md-6"><label className="form-label">{label}</label><input className="form-control" type={type} value={value} required={required} min={min} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Select({ label, value, onChange, required = false, children }) {
  return <div className="col-md-6"><label className="form-label">{label}</label><select className="form-select" value={value} required={required} onChange={(event) => onChange(event.target.value)}>{children}</select></div>;
}

function FormActions({ onCancel }) {
  return <div className="mt-4 d-flex justify-content-end gap-2"><button type="button" className="btn" onClick={onCancel}>Cancelar</button><button type="submit" className="btn btn-primary">Registrar entrega</button></div>;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-PE');
}
