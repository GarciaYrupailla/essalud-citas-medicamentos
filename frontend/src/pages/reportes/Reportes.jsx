import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFilter,
  IconPrinter,
  IconRefresh,
  IconReportAnalytics
} from '@tabler/icons-react';
import { http } from '../../api/http.js';

const tabs = [
  { key: 'resumen', label: 'Resumen general' },
  { key: 'citas', label: 'Citas medicas' },
  { key: 'entregas', label: 'Entregas' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'especialidades', label: 'Especialidades' }
];

const initialFilters = { desde: '', hasta: '', estado: '', especialidad: '', busqueda: '' };

export function Reportes() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [activeTab, setActiveTab] = useState('resumen');
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEspecialidades();
    loadReportes(initialFilters);
  }, []);

  async function loadEspecialidades() {
    const response = await http.get('/medicos/especialidades');
    setEspecialidades(response.data);
  }

  async function loadReportes(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const response = await http.get('/reportes', { params: cleanFilters(nextFilters) });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadReportes(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    loadReportes(initialFilters);
  }

  const currentReport = useMemo(() => buildCurrentReport(activeTab, data), [activeTab, data]);

  function exportPdf() {
    if (!currentReport.rows.length) return;
    const doc = new jsPDF({ orientation: currentReport.columns.length > 5 ? 'landscape' : 'portrait' });
    doc.setFontSize(14);
    doc.text(`EsSalud - ${currentReport.title}`, 14, 16);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 23);
    autoTable(doc, {
      head: [currentReport.columns.map((column) => column.label)],
      body: currentReport.rows.map((row) => currentReport.columns.map((column) => row[column.key] ?? '')),
      startY: 30,
      styles: { fontSize: 8 }
    });
    doc.save(`reporte-${activeTab}.pdf`);
  }

  function exportExcel() {
    if (!currentReport.rows.length) return;
    const rows = currentReport.rows.map((row) => Object.fromEntries(currentReport.columns.map((column) => [column.label, row[column.key] ?? ''])));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentReport.title.slice(0, 31));
    XLSX.writeFile(workbook, `reporte-${activeTab}.xlsx`);
  }

  if (loading && !data) return <div className="page page-center"><div className="spinner-border text-primary" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <div className="page-header d-print-none mb-3">
        <div className="row align-items-center">
          <div className="col">
            <div className="page-pretitle">Analisis administrativo y operativo</div>
            <h1 className="page-title d-flex align-items-center gap-2"><IconReportAnalytics /> Reportes del Sistema</h1>
          </div>
          <div className="col-auto d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={exportPdf}><IconFileTypePdf size={18} /> PDF</button>
            <button className="btn btn-outline-success" onClick={exportExcel}><IconFileSpreadsheet size={18} /> Excel</button>
            <button className="btn btn-outline-secondary" onClick={() => window.print()}><IconPrinter size={18} /> Imprimir</button>
          </div>
        </div>
      </div>

      <div className="card mb-4 d-print-none">
        <form onSubmit={handleSubmit}>
          <div className="card-header"><h3 className="card-title"><IconFilter size={18} /> Filtros de reporte</h3></div>
          <div className="card-body">
            <div className="row g-3">
              <Input label="Desde" type="date" value={filters.desde} onChange={(value) => setFilters({ ...filters, desde: value })} />
              <Input label="Hasta" type="date" value={filters.hasta} onChange={(value) => setFilters({ ...filters, hasta: value })} />
              <Select label="Estado de cita" value={filters.estado} onChange={(value) => setFilters({ ...filters, estado: value })}>
                <option value="">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Atendida">Atendida</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
              <Select label="Especialidad" value={filters.especialidad} onChange={(value) => setFilters({ ...filters, especialidad: value })}>
                <option value="">Todas</option>
                {especialidades.map((item) => <option key={item.idEspecialidad} value={item.idEspecialidad}>{item.nombre}</option>)}
              </Select>
              <div className="col-md-4">
                <label className="form-label">Busqueda</label>
                <input className="form-control" value={filters.busqueda} placeholder="Paciente, DNI, medico, medicamento..." onChange={(event) => setFilters({ ...filters, busqueda: event.target.value })} />
              </div>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn" onClick={clearFilters}><IconRefresh size={18} /> Limpiar</button>
            <button type="submit" className="btn btn-primary">Filtrar</button>
          </div>
        </form>
      </div>

      {data && (
        <>
          <div className="row row-cards mb-4">
            <Metric title="Total citas" value={data.resumen.totalCitas} tone="primary" />
            <Metric title="Atendidas" value={data.resumen.citasAtendidas} tone="success" />
            <Metric title="Pendientes" value={data.resumen.citasPendientes} tone="info" />
            <Metric title="Unidades entregadas" value={data.resumen.unidadesEntregadas} tone="warning" />
            <Metric title="Stock bajo" value={data.resumen.medicamentosStockBajo} tone="danger" />
            <Metric title="Por vencer" value={data.resumen.medicamentosPorVencer} tone="orange" />
          </div>

          <div className="card">
            <div className="card-header d-print-none">
              <ul className="nav nav-tabs card-header-tabs">
                {tabs.map((tab) => (
                  <li className="nav-item" key={tab.key}>
                    <button className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)} type="button">{tab.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'resumen' ? <Resumen data={data} /> : <ReportTable report={currentReport} />}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Resumen({ data }) {
  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <h3 className="h4">Resumen de citas</h3>
        <ReportTable report={buildCurrentReport('citas', data, 8)} />
      </div>
      <div className="col-lg-6">
        <h3 className="h4">Riesgos de inventario</h3>
        <ReportTable report={buildCurrentReport('medicamentos', data, 8)} />
      </div>
    </div>
  );
}

function ReportTable({ report }) {
  return (
    <div className="table-responsive">
      <table className="table table-vcenter table-striped">
        <thead>
          <tr>{report.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {report.rows.map((row, index) => (
            <tr key={index}>{report.columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}</tr>
          ))}
          {report.rows.length === 0 && <tr><td colSpan={report.columns.length} className="text-secondary text-center py-4">No hay datos para mostrar.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ title, value, tone }) {
  return <div className="col-sm-6 col-xl-2"><div className={`card border-${tone}`}><div className="card-body"><div className="text-secondary small">{title}</div><div className={`h1 mb-0 text-${tone}`}>{value}</div></div></div></div>;
}

function Input({ label, type, value, onChange }) {
  return <div className="col-md-2"><label className="form-label">{label}</label><input className="form-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Select({ label, value, onChange, children }) {
  return <div className="col-md-2"><label className="form-label">{label}</label><select className="form-select" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></div>;
}

function buildCurrentReport(type, data, limit = null) {
  if (!data) return { title: '', columns: [], rows: [] };

  const reports = {
    citas: {
      title: 'Citas medicas',
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'hora', label: 'Hora' },
        { key: 'paciente', label: 'Paciente' },
        { key: 'dni', label: 'DNI' },
        { key: 'medico', label: 'Medico' },
        { key: 'especialidad', label: 'Especialidad' },
        { key: 'estado', label: 'Estado' },
        { key: 'motivo', label: 'Motivo' }
      ],
      rows: data.citas.map((item) => ({
        fecha: formatDate(item.fecha),
        hora: item.hora,
        paciente: `${item.pacienteNombres} ${item.pacienteApellidos}`,
        dni: item.dni,
        medico: `${item.medicoNombres} ${item.medicoApellidos}`,
        especialidad: item.especialidad,
        estado: item.estado,
        motivo: item.motivo || '-'
      }))
    },
    entregas: {
      title: 'Entregas de medicamentos',
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'paciente', label: 'Paciente' },
        { key: 'dni', label: 'DNI' },
        { key: 'medicamento', label: 'Medicamento' },
        { key: 'cantidad', label: 'Cantidad' },
        { key: 'responsable', label: 'Responsable' },
        { key: 'observacion', label: 'Observacion' }
      ],
      rows: data.entregas.map((item) => ({
        fecha: formatDateTime(item.fechaEntrega),
        paciente: `${item.pacienteNombres} ${item.pacienteApellidos}`,
        dni: item.dni,
        medicamento: item.medicamento,
        cantidad: item.cantidad,
        responsable: item.responsable,
        observacion: item.observacion || '-'
      }))
    },
    medicamentos: {
      title: 'Inventario de medicamentos',
      columns: [
        { key: 'nombre', label: 'Medicamento' },
        { key: 'stock', label: 'Stock' },
        { key: 'stockMinimo', label: 'Minimo' },
        { key: 'fechaVencimiento', label: 'Vencimiento' },
        { key: 'condicion', label: 'Condicion' }
      ],
      rows: data.medicamentos.map((item) => ({
        nombre: item.nombre,
        stock: item.stock,
        stockMinimo: item.stockMinimo,
        fechaVencimiento: formatDate(item.fechaVencimiento),
        condicion: item.condicion
      }))
    },
    especialidades: {
      title: 'Reporte por especialidad',
      columns: [
        { key: 'nombre', label: 'Especialidad' },
        { key: 'medicos', label: 'Medicos' },
        { key: 'citasPendientes', label: 'Pendientes' },
        { key: 'citasAtendidas', label: 'Atendidas' },
        { key: 'citasCanceladas', label: 'Canceladas' }
      ],
      rows: data.especialidades
    }
  };

  const report = reports[type] || reports.citas;
  return limit ? { ...report, rows: report.rows.slice(0, limit) } : report;
}

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-PE');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-PE');
}
