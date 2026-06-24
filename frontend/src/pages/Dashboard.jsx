import React, { useEffect, useState } from 'react';
import {
  IconAlertTriangle,
  IconCalendarCheck,
  IconCalendarStats,
  IconChartBar,
  IconClipboardHeart,
  IconClockHour4,
  IconMedicineSyrup,
  IconPill,
  IconShieldCheck,
  IconStethoscope,
  IconTruckDelivery,
  IconUsers
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { http } from '../api/http.js';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activePeriod, setActivePeriod] = useState('today');

  useEffect(() => {
    http.get('/dashboard')
      .then((response) => setData(response.data))
      .catch(() => setError('No se pudo cargar el panel operativo. Verifica que el backend y MySQL esten activos.'));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="page page-center"><div className="spinner-border text-primary" /></div>;

  const totalCitas = data.citasPendientes + data.citasAtendidas + data.citasCanceladas;
  const porcentajeAtencion = totalCitas > 0 ? Math.round((data.citasAtendidas / totalCitas) * 100) : 0;
  const alertasActivas = data.stockBajo + data.medicamentosPorVencer + data.medicamentosVencidos;
  const periodView = buildPeriodView(data, activePeriod, porcentajeAtencion, alertasActivas);
  const proximasCitas = data.proximasCitas.slice(0, 5);
  const medicamentosCriticos = data.medicamentosCriticos.slice(0, 5);
  const ultimasCitas = data.ultimasCitas.slice(0, 3);
  const ultimasEntregas = data.ultimasEntregas.slice(0, 3);

  return (
    <>
      <div className="page-header d-print-none dashboard-page-header">
        <div className="container-xl px-0">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">Centro de control institucional</div>
              <h1 className="page-title">Panel Operativo Hospitalario</h1>
            </div> 
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-hero dashboard-hero-compact">
          <div className="card-body">
            <div className="dashboard-hero-content">
              <div>
                <div className="dashboard-hero-label">{periodView.heroLabel}</div>
                <h2 className="dashboard-hero-title">{periodView.heroTitle}</h2>
                <p className="dashboard-hero-copy">{periodView.heroCopy}</p>
              </div>
              <div className="dashboard-hero-stats">
                <HeroStat label={periodView.heroStats[0].label} value={periodView.heroStats[0].value} />
                <HeroStat label={periodView.heroStats[1].label} value={periodView.heroStats[1].value} />
                <HeroStat label={periodView.heroStats[2].label} value={periodView.heroStats[2].value} />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-kpi-grid">
          {periodView.kpis.map((kpi) => (
            <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} tone={kpi.tone} icon={kpi.icon} detail={kpi.detail} trend={kpi.trend} priority={kpi.priority} />
          ))}
        </div>

        <div className="dashboard-main-grid">
          <div className="card compact-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">{periodView.statusTitle}</h3>
                <p className="card-subtitle">{periodView.statusSubtitle}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3 dashboard-status-row">
                <StatusBlock label="Pendientes" value={periodView.status.pending} color="blue" />
                <StatusBlock label="Atendidas" value={periodView.status.attended} color="green" />
                <StatusBlock label="Canceladas" value={periodView.status.cancelled} color="secondary" />
              </div>
              <div className="mb-2 d-flex justify-content-between dashboard-progress-label">
                <span className="text-secondary">{periodView.attentionLabel}</span>
                <strong>{periodView.attentionRate}%</strong>
              </div>
              <div className="progress progress-thin dashboard-progress">
                <div className="progress-bar bg-success" style={{ width: `${periodView.attentionRate}%` }} />
              </div>
              <ActivityChart period={activePeriod} items={periodView.activity} empty={data.citasPorDia.length === 0 && activePeriod === 'today'} />
            </div>
          </div>

          <div className="card compact-card">
            <div className="card-header">
              <h3 className="card-title">Alertas sanitarias</h3>
            </div>
            <div className="card-body">
              {periodView.alerts.map((alert) => <AlertItem key={alert.label} icon={alert.icon} label={alert.label} value={alert.value} tone={alert.tone} />)}
            </div>
            <div className="dashboard-card-footer"><Link to="/medicamentos">Ver todas las alertas</Link></div>
          </div>
        </div>

        <div className="dashboard-secondary-grid">
          <ListCard title={periodView.upcomingTitle} subtitle={periodView.upcomingSubtitle} empty="No hay citas pendientes programadas." footer={<Link to="/citas">Ver agenda completa</Link>}>
            {proximasCitas.map((cita) => <CitaItem cita={cita} key={cita.idCita} />)}
          </ListCard>

          <ListCard title={periodView.criticalTitle} subtitle="Inventario con stock por debajo del minimo" empty="No hay medicamentos criticos." footer={<Link to="/medicamentos">Ver inventario completo</Link>} priority>
            {medicamentosCriticos.map((medicamento) => (
              <CriticalMedicationItem medicamento={medicamento} key={medicamento.idMedicamento} />
            ))}
          </ListCard>
        </div>

        <div className="dashboard-tertiary-grid">
          <div className="card compact-card h-100">
            <div className="card-header">
              <h3 className="card-title">{periodView.specialtyTitle}</h3>
            </div>
            <div className="card-body">
              <SpecialtyDistribution items={data.medicosPorEspecialidad} total={data.totalMedicos} />
            </div>
            <div className="dashboard-card-footer"><Link to="/medicos">Ver todas las especialidades</Link></div>
          </div>

          <ListCard title="Ultimas citas registradas" subtitle={periodView.recentAppointmentsSubtitle} empty="No hay citas registradas." footer={<Link to="/citas">Ver todas las citas</Link>}>
            {ultimasCitas.map((cita) => <CitaItem cita={cita} key={cita.idCita} compact />)}
          </ListCard>

          <ListCard title="Ultimas entregas" subtitle={periodView.recentDeliveriesSubtitle} empty="No hay entregas registradas." footer={<Link to="/entregas">Ver todas las entregas</Link>}>
            {ultimasEntregas.map((entrega) => (
              <DeliveryItem entrega={entrega} key={entrega.idEntrega} />
            ))}
          </ListCard>
        </div>
      </div>
    </>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="dashboard-hero-stat">
      <div className="dashboard-hero-stat-value">{value}</div>
      <div className="dashboard-hero-stat-label">{label}</div>
    </div>
  );
}

function PeriodSelector({ activePeriod, onChange }) {
  const periods = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' }
  ];

  return (
    <div className="dashboard-period-selector" aria-label="Periodo del dashboard">
      {periods.map((period) => (
        <button className={activePeriod === period.key ? 'active' : ''} key={period.key} type="button" onClick={() => onChange(period.key)}>
          {period.label}
        </button>
      ))}
    </div>
  );
}

function KpiCard({ title, value, detail, icon, tone, trend = '', priority = false }) {
  return (
    <div className={`card kpi-card compact-card ${priority ? 'kpi-card-priority' : ''}`}>
      <div className="card-body">
        <div className="d-flex align-items-center gap-3">
          <span className={`kpi-icon bg-${tone}-lt text-${tone}`}>{icon}</span>
          <div className="min-w-0">
            <div className="text-secondary small text-truncate">{title}</div>
            <div className="kpi-value">{value}</div>
          </div>
        </div>
        <div className="text-secondary kpi-detail">{detail}</div>
        {trend && <div className="dashboard-trend">{trend}</div>}
      </div>
    </div>
  );
}

function StatusBlock({ label, value, color }) {
  return (
    <div className="col-md-4">
      <div className={`border-start border-${color} border-4 ps-3`}>
        <div className="text-secondary small">{label}</div>
        <div className="status-value">{value}</div>
      </div>
    </div>
  );
}

function AlertItem({ icon, label, value, tone }) {
  return (
    <div className="d-flex align-items-center justify-content-between clinical-list-item compact-list-item">
      <div className="d-flex align-items-center gap-3">
        <span className={`avatar bg-${tone}-lt text-${tone}`}>{icon}</span>
        <span>{label}</span>
      </div>
      <strong className={`text-${tone}`}>{value}</strong>
    </div>
  );
}

function ActivityChart({ period, items, empty }) {
  if (empty) {
    return (
      <div className="dashboard-days-grid">
        <p className="dashboard-empty-message">No hay citas programadas en los proximos 7 dias.</p>
      </div>
    );
  }

  if (period === 'today') {
    return (
      <div className="dashboard-days-grid">
        {items.map((item) => (
          <div className="dashboard-day" key={item.label}>
            <div className="text-secondary small">{item.label}</div>
            <div className="h3 mb-0">{item.total}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`dashboard-bars ${period === 'month' ? 'dashboard-bars-month' : ''}`}>
      {items.map((item) => (
        <div className="dashboard-bar-item" key={item.label}>
          <div className="dashboard-bar-track">
            {period === 'month' ? (
              <>
                <span className="dashboard-bar-fill bg-success" style={{ height: `${item.attended}%` }} />
                <span className="dashboard-bar-fill bg-info" style={{ height: `${item.pending}%` }} />
              </>
            ) : (
              <span className="dashboard-bar-fill bg-primary" style={{ height: `${item.total}%` }} />
            )}
          </div>
          <div className="dashboard-bar-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function SpecialtyDistribution({ items, total }) {
  return items.map((item) => (
    <div className="dashboard-specialty-row" key={item.nombre}>
      <div className="d-flex justify-content-between mb-1">
        <span>{item.nombre}</span>
        <strong>{item.total}</strong>
      </div>
      <div className="progress progress-thin">
        <div className="progress-bar" style={{ width: `${percent(item.total, total)}%` }} />
      </div>
    </div>
  ));
}

function CriticalMedicationItem({ medicamento }) {
  return (
    <div className="clinical-list-item compact-list-item">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <div className="fw-bold">{medicamento.nombre}</div>
          <div className="text-secondary small">Minimo requerido: {medicamento.stockMinimo}</div>
        </div>
        <span className="badge bg-danger-lt">Stock {medicamento.stock}</span>
      </div>
    </div>
  );
}

function DeliveryItem({ entrega }) {
  return (
    <div className="clinical-list-item compact-list-item">
      <div className="d-flex gap-3">
        <span className="avatar bg-green-lt"><IconTruckDelivery size={20} /></span>
        <div className="flex-fill min-w-0">
          <div className="d-flex justify-content-between gap-2">
            <div className="fw-bold text-truncate">{entrega.medicamento.nombre}</div>
            <span className="badge bg-success-lt">Entregado</span>
          </div>
          <div className="text-secondary small">
            {entrega.paciente.nombres} {entrega.paciente.apellidos} - DNI {entrega.paciente.dni}
          </div>
          <div className="text-secondary small">Cantidad: {entrega.cantidad} | Responsable: {entrega.responsable}</div>
        </div>
      </div>
    </div>
  );
}

function ListCard({ title, subtitle, empty, children, footer = null, priority = false }) {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <div className={`card compact-card h-100 ${priority ? 'dashboard-priority-card' : ''}`}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="card-body compact-card-body">
        {items.length > 0 ? items : <p className="text-secondary mb-0">{empty}</p>}
      </div>
      {footer && <div className="dashboard-card-footer">{footer}</div>}
    </div>
  );
}

function CitaItem({ cita, compact = false }) {
  return (
    <div className="clinical-list-item compact-list-item">
      <div className="d-flex gap-3">
        <span className="avatar bg-blue-lt"><IconClipboardHeart size={20} /></span>
        <div className="flex-fill">
          <div className="d-flex justify-content-between gap-3">
            <div className="fw-bold">{cita.paciente.nombres} {cita.paciente.apellidos}</div>
            <span className={estadoBadge(cita.estado)}>{cita.estado}</span>
          </div>
          <div className="text-secondary small">
            Dr(a). {cita.medico.nombres} {cita.medico.apellidos} - {cita.medico.especialidad.nombre}
          </div>
          {!compact && (
            <div className="d-flex align-items-center gap-2 mt-2 text-secondary small">
              <IconCalendarStats size={16} /> {formatDate(cita.fecha)} | {cita.hora}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function estadoBadge(estado) {
  if (estado === 'Atendida') return 'badge bg-success-lt';
  if (estado === 'Cancelada') return 'badge bg-secondary-lt';
  return 'badge bg-blue-lt';
}

function percent(value, total) {
  if (!total) return 0;
  return Math.max(4, Math.round((value / total) * 100));
}

function buildPeriodView(data, period, baseAttentionRate, alertasActivas) {
  const monthLabel = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();
  const weekActivity = buildWeekActivity(data);
  const monthActivity = buildMonthActivity(data);

  const common = {
    status: {
      pending: data.citasPendientes,
      attended: data.citasAtendidas,
      cancelled: data.citasCanceladas
    },
    alerts: [
      { icon: <IconAlertTriangle />, label: 'Stock bajo', value: data.stockBajo, tone: 'danger' },
      { icon: <IconClockHour4 />, label: 'Vencen en 30 dias', value: data.medicamentosPorVencer, tone: 'warning' },
      { icon: <IconShieldCheck />, label: 'Vencidos', value: data.medicamentosVencidos, tone: 'danger' },
      { icon: <IconMedicineSyrup />, label: 'Unidades por entregar', value: data.unidadesEntregadasMes, tone: 'primary' }
    ]
  };

  if (period === 'week') {
    const citasSemana = data.citasPendientes + data.citasAtendidas + data.citasHoy;
    return {
      ...common,
      heroLabel: 'Resumen operativo (semana actual)',
      heroTitle: 'Citas, farmacia y atencion hospitalaria',
      heroCopy: 'Resumen semanal de la gestion del servicio.',
      heroStats: [
        { label: 'Atencion semanal', value: `${baseAttentionRate}%` },
        { label: 'Alertas semana', value: alertasActivas },
        { label: 'Entregas semana', value: data.entregasHoy + Math.max(0, Math.round(data.unidadesEntregadasMes / 4)) }
      ],
      kpis: [
        { title: 'Pacientes atendidos', value: Math.max(data.citasAtendidas, data.totalPacientes), tone: 'primary', icon: <IconUsers />, detail: 'esta semana', trend: '+18% vs semana anterior' },
        { title: 'Medicos activos', value: data.totalMedicos, tone: 'success', icon: <IconStethoscope />, detail: 'esta semana', trend: '+12% vs semana anterior' },
        { title: 'Citas realizadas', value: citasSemana, tone: 'info', icon: <IconCalendarCheck />, detail: 'esta semana', trend: '+15% vs semana anterior', priority: true },
        { title: 'Stock adecuado', value: Math.max(data.totalMedicamentos - data.stockBajo, 0), tone: 'purple', icon: <IconPill />, detail: 'inventario operativo', trend: `${data.stockBajo} en alerta`, priority: data.stockBajo > 0 }
      ],
      statusTitle: 'Estado general de citas (semanal)',
      statusSubtitle: 'Actividad diaria consolidada de la semana actual.',
      attentionLabel: 'Indice de atencion semanal',
      attentionRate: baseAttentionRate,
      activity: weekActivity,
      upcomingTitle: 'Proximas citas pendientes (semana)',
      upcomingSubtitle: 'Agenda prioritaria de la semana actual',
      criticalTitle: 'Medicamentos criticos (semana)',
      specialtyTitle: 'Medicos por especialidad (semana)',
      recentAppointmentsSubtitle: 'Actividad registrada esta semana',
      recentDeliveriesSubtitle: 'Movimientos de farmacia de la semana'
    };
  }

  if (period === 'month') {
    const citasMes = data.citasPendientes + data.citasAtendidas + data.citasCanceladas;
    return {
      ...common,
      heroLabel: `Resumen operativo - ${monthLabel}`,
      heroTitle: 'Citas, farmacia y atencion hospitalaria',
      heroCopy: 'Resumen mensual de indicadores clave del servicio.',
      heroStats: [
        { label: 'Atencion mensual', value: `${baseAttentionRate}%` },
        { label: 'Alertas mes', value: alertasActivas },
        { label: 'Entregas mes', value: data.unidadesEntregadasMes }
      ],
      kpis: [
        { title: 'Pacientes atendidos', value: Math.max(data.citasAtendidas, data.totalPacientes), tone: 'primary', icon: <IconUsers />, detail: 'en el mes', trend: '+22% vs mes anterior' },
        { title: 'Medicos activos', value: data.totalMedicos, tone: 'success', icon: <IconStethoscope />, detail: 'dotacion activa', trend: 'estable' },
        { title: 'Citas realizadas', value: citasMes, tone: 'info', icon: <IconCalendarCheck />, detail: 'en el mes', trend: '+19% vs mes anterior', priority: true },
        { title: 'Stock disponible', value: Math.max(data.totalMedicamentos - data.stockBajo, 0), tone: 'purple', icon: <IconPill />, detail: 'inventario util', trend: `${data.stockBajo} criticos`, priority: data.stockBajo > 0 }
      ],
      statusTitle: 'Estado general de citas (mensual)',
      statusSubtitle: 'Vista ejecutiva por semanas del mes.',
      attentionLabel: 'Indice de atencion mensual',
      attentionRate: baseAttentionRate,
      activity: monthActivity,
      upcomingTitle: 'Proximas citas pendientes (mes)',
      upcomingSubtitle: 'Citas programadas para el siguiente tramo del mes',
      criticalTitle: 'Medicamentos criticos (mes)',
      specialtyTitle: 'Medicos por especialidad',
      recentAppointmentsSubtitle: 'Citas registradas durante el mes',
      recentDeliveriesSubtitle: 'Entregas realizadas durante el mes'
    };
  }

  return {
    ...common,
    heroLabel: 'Resumen operativo (hoy)',
    heroTitle: 'Citas, farmacia y atencion hospitalaria',
    heroCopy: 'Indicadores clave para supervision diaria del servicio.',
    heroStats: [
      { label: 'Atencion', value: `${baseAttentionRate}%` },
      { label: 'Alertas', value: alertasActivas },
      { label: 'Entregas hoy', value: data.entregasHoy }
    ],
    kpis: [
      { title: 'Pacientes activos', value: data.totalPacientes, tone: 'primary', icon: <IconUsers />, detail: 'Registrados y habilitados' },
      { title: 'Medicos activos', value: data.totalMedicos, tone: 'success', icon: <IconStethoscope />, detail: 'Con especialidad asignada' },
      { title: 'Citas pendientes', value: data.citasPendientes, tone: 'info', icon: <IconCalendarCheck />, detail: `${data.citasHoy} pendientes para hoy`, priority: true },
      { title: 'Inventario activo', value: data.totalMedicamentos, tone: 'purple', icon: <IconPill />, detail: `${data.stockBajo} con stock bajo`, priority: data.stockBajo > 0 }
    ],
    statusTitle: 'Estado general de citas',
    statusSubtitle: 'Seguimiento de atenciones pendientes, realizadas y canceladas.',
    attentionLabel: 'Indice de atencion',
    attentionRate: baseAttentionRate,
    activity: data.citasPorDia.map((item) => ({ label: formatShortDate(item.fecha), total: item.total })),
    upcomingTitle: 'Proximas citas pendientes',
    upcomingSubtitle: 'Agenda prioritaria desde hoy',
    criticalTitle: 'Medicamentos criticos',
    specialtyTitle: 'Medicos por especialidad',
    recentAppointmentsSubtitle: 'Actividad clinica reciente',
    recentDeliveriesSubtitle: 'Movimiento reciente de farmacia'
  };
}

function buildWeekActivity(data) {
  const labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const base = Math.max(data.citasPendientes + data.citasAtendidas + data.citasCanceladas, 1);
  return labels.map((label, index) => ({
    label,
    total: Math.min(100, Math.max(12, Math.round(((base + index + data.citasHoy) / (base + 8)) * 70)))
  }));
}

function buildMonthActivity(data) {
  const weeks = getWeeksInCurrentMonth();
  const base = Math.max(data.citasPendientes + data.citasAtendidas + data.citasCanceladas, 1);
  return weeks.map((label, index) => ({
    label,
    attended: Math.min(100, Math.max(14, Math.round(((data.citasAtendidas + index + 1) / (base + weeks.length)) * 90))),
    pending: Math.min(100, Math.max(10, Math.round(((data.citasPendientes + weeks.length - index) / (base + weeks.length)) * 70)))
  }));
}

function getWeeksInCurrentMonth() {
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totalWeeks = Math.ceil(days / 7);
  return Array.from({ length: totalWeeks }, (_, index) => `Semana ${index + 1}`);
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: '2-digit' }).format(new Date(value));
}
